const jwtManager = require("../utils/jwt");
const { AppError } = require("./errorHandler");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const privateKeyManager = require("../utils/privateKeyManager");

/**
 * Middleware to verify access token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtManager.extractTokenFromHeader(authHeader);

    if (!token) {
      return next(new AppError("Access token is required", 401));
    }

    // Verify the access token
    const decoded = jwtManager.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Access token has expired", 401));
    } else if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid access token", 401));
    }

    logger.error("Authentication error:", error);
    next(new AppError("Authentication failed", 401));
  }
};

/**
 * Middleware to verify refresh token
 */
const authenticateRefreshToken = async (req, res, next) => {
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

    // Attach user info and session data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.sessionData = sessionData;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Refresh token has expired", 401));
    } else if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid refresh token", 401));
    }

    logger.error("Refresh token authentication error:", error);
    next(new AppError("Refresh token authentication failed", 401));
  }
};

/**
 * Middleware to check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtManager.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = jwtManager.verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Don't fail the request, just continue without user info
    logger.warn("Optional authentication failed:", error.message);
    next();
  }
};

/**
 * Middleware to attach user's decrypted private key to request
 * This should be used after authenticate middleware
 */
const attachPrivateKey = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new AppError("User not authenticated", 401));
    }

    const decryptedPrivateKey = await privateKeyManager.getPrivateKey(
      req.user.id
    );

    if (decryptedPrivateKey) {
      req.userPrivateKey = decryptedPrivateKey;
    } else {
      return next(
        new AppError("Private key not available. Please login again.", 401)
      );
    }

    next();
  } catch (error) {
    logger.error("Error attaching private key:", error);
    next(new AppError("Failed to retrieve private key", 500));
  }
};

module.exports = {
  authenticate,
  authenticateRefreshToken,
  authorize,
  optionalAuth,
  attachPrivateKey,
};
