const jwtManager = require("../utils/jwt");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { user } = require("../../db/models");
const bcrypt = require("bcryptjs");
const { sendEmailOTP } = require("../utils/mailersend");
const crypto = require("crypto");
const custodialLite = require("../utils/custodialLite");
const { wallet } = require("../../db/models");
const { log } = require("console");

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await user.findOne({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError("Email already registered", 400));
    }

    // --- Custodial-lite private key generation and encryption ---
    const privateKeySalt = custodialLite.generateSalt();
    const derivedKey = custodialLite.deriveKey(password, privateKeySalt);
    const privateKey = custodialLite.generatePrivateKey();
    const { encrypted, iv } = custodialLite.encryptPrivateKey(
      privateKey,
      derivedKey
    );

    // Derive wallet address from private key
    const address = custodialLite.getAddressFromPrivateKey(privateKey);

    const newUser = await user.create({
      email,
      password,
      isVerified: false,
      encryptedPrivateKey: encrypted,
      privateKeySalt,
      privateKeyIv: iv,
    });

    // Store wallet address in Wallet model (Polygon Amoy)
    await wallet.create({
      userId: newUser.id,
      chainId: 80002, // Polygon Amoy testnet
      chainName: "Polygon Amoy",
      address,
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      data: {
        userId: newUser.id,
        walletAddress: address,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    next(error);
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userExist = await user.findOne({ where: { email } });
    if (!userExist) {
      return next(new AppError("User not found", 404));
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await userExist.update({ otp, otpExpires });
    await sendEmailOTP(email, otp);
    res
      .status(200)
      .json({ status: "success", message: "OTP sent to your email." });
  } catch (error) {
    logger.error("Send OTP error:", error);
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const userExist = await user.findOne({ where: { email } });
    if (!userExist) {
      return next(new AppError("User not found", 404));
    }
    if (
      !userExist.otp ||
      userExist.otp !== otp ||
      !userExist.otpExpires ||
      userExist.otpExpires < new Date()
    ) {
      return next(new AppError("Invalid or expired OTP", 400));
    }
    await userExist.update({
      isEmailVerified: true,
      otp: null,
      otpExpires: null,
    });
    res
      .status(200)
      .json({ status: "success", message: "Email verified successfully." });
  } catch (error) {
    logger.error("Verify OTP error:", error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userExist = await user.findOne({ where: { email } });

    if (!userExist || !(await bcrypt.compare(password, userExist.password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Decrypt user's private key using custodial-lite method
    let decryptedPrivateKey = null;
    if (
      userExist.encryptedPrivateKey &&
      userExist.privateKeySalt &&
      userExist.privateKeyIv
    ) {
      try {
        const derivedKey = custodialLite.deriveKey(
          password,
          userExist.privateKeySalt
        );
        decryptedPrivateKey = custodialLite.decryptPrivateKey(
          userExist.encryptedPrivateKey,
          derivedKey,
          userExist.privateKeyIv
        );
        console.log("decryptedPrivateKey:", decryptedPrivateKey);

        // Store decrypted private key temporarily in Redis for demo token operations
        const privateKeyManager = require("../utils/privateKeyManager");
        await privateKeyManager.storePrivateKey(
          userExist.id,
          decryptedPrivateKey
        );
      } catch (e) {
        logger.error("Failed to decrypt user private key:", e);
        // Optionally: return error or continue without private key
      }
    }

    // Fetch wallet address from Wallet model (Polygon Amoy)
    const userWallet = await wallet.findOne({
      where: { userId: userExist.id, chainId: 80002 },
    });

    // Generate tokens
    const accessToken = jwtManager.generateAccessToken({
      id: userExist.id,
      email: userExist.email,
      role: userExist.role,
    });
    const { refreshToken, refreshTokenId } = jwtManager.generateRefreshToken({
      id: userExist.id,
      email: userExist.email,
      role: userExist.role,
    });

    // Store refresh token in Redis
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    await jwtManager.storeRefreshToken(
      userExist.id,
      refreshTokenId,
      deviceInfo
    );

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: userExist.id,
          email: userExist.email,
          kycStatus: userExist.kycStatus,
          role: userExist.role,
          walletAddress: userWallet ? userWallet.address : null,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Verify the refresh token
    const decoded = jwtManager.verifyRefreshToken(refreshToken);

    // Validate the refresh token in Redis
    const sessionData = await jwtManager.validateRefreshToken(decoded.tokenId);

    if (!sessionData) {
      return next(new AppError("Refresh token is invalid or expired", 401));
    }

    // Check if the user ID matches
    if (sessionData.userId !== decoded.id) {
      return next(new AppError("Invalid refresh token", 401));
    }

    // Get user data
    const userExist = await user.findByPk(decoded.id);
    if (!userExist) {
      return next(new AppError("User not found", 404));
    }

    // Generate new tokens
    const newAccessToken = jwtManager.generateAccessToken({
      id: userExist.id,
      email: userExist.email,
      role: userExist.role,
    });
    const { refreshToken: newRefreshToken, refreshTokenId: newRefreshTokenId } =
      jwtManager.generateRefreshToken({
        id: userExist.id,
        email: userExist.email,
        role: userExist.role,
      });

    // Revoke old refresh token and store new one
    await jwtManager.revokeRefreshToken(decoded.tokenId, decoded.id);

    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    await jwtManager.storeRefreshToken(
      userExist.id,
      newRefreshTokenId,
      deviceInfo
    );

    res.status(200).json({
      status: "success",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Refresh token has expired", 401));
    } else if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid refresh token", 401));
    }

    logger.error("Refresh token error:", error);
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      try {
        const decoded = jwtManager.verifyRefreshToken(refreshToken);
        await jwtManager.revokeRefreshToken(decoded.tokenId, decoded.id);

        // Clear private key from Redis
        const privateKeyManager = require("../utils/privateKeyManager");
        await privateKeyManager.clearPrivateKey(decoded.id);
      } catch (error) {
        // If refresh token is invalid, just continue with logout
        logger.warn("Invalid refresh token during logout:", error.message);
      }
    }

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    // Revoke all sessions for the user
    await jwtManager.revokeAllUserSessions(req.user.id);

    // Clear private key from Redis
    const privateKeyManager = require("../utils/privateKeyManager");
    await privateKeyManager.clearPrivateKey(req.user.id);

    res.status(200).json({
      status: "success",
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    logger.error("Logout all error:", error);
    next(error);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    const sessions = await jwtManager.getUserSessions(req.user.id);

    res.status(200).json({
      status: "success",
      data: {
        sessions,
      },
    });
  } catch (error) {
    logger.error("Get sessions error:", error);
    next(error);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    const { refreshTokenId } = req.params;

    if (!refreshTokenId) {
      return next(new AppError("Refresh token ID is required", 400));
    }

    // Verify the session belongs to the user
    const sessionData = await jwtManager.validateRefreshToken(refreshTokenId);
    if (!sessionData || sessionData.userId !== req.user.id) {
      return next(new AppError("Session not found or access denied", 404));
    }

    await jwtManager.revokeRefreshToken(refreshTokenId, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Session revoked successfully",
    });
  } catch (error) {
    logger.error("Revoke session error:", error);
    next(error);
  }
};
