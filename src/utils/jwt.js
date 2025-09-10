const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const logger = require("./logger");
const redisClient = require("./redis");

// Module-level configuration
const accessTokenSecret = process.env.JWT_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
const accessTokenExpiry = process.env.JWT_EXPIRES_IN || "15m";
const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function generateAccessToken(payload) {
  try {
    return jwt.sign(payload, accessTokenSecret, {
      expiresIn: accessTokenExpiry,
      issuer: "stablebank",
      audience: "stablebank-users",
    });
  } catch (error) {
    logger.error("Error generating access token:", error);
    throw error;
  }
}

function generateRefreshToken(payload) {
  try {
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { ...payload, tokenId: refreshTokenId },
      refreshTokenSecret,
      {
        expiresIn: refreshTokenExpiry,
        issuer: "stablebank",
        audience: "stablebank-users",
      }
    );

    return {
      refreshToken,
      refreshTokenId,
    };
  } catch (error) {
    logger.error("Error generating refresh token:", error);
    throw error;
  }
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, accessTokenSecret, {
      issuer: "stablebank",
      audience: "stablebank-users",
    });
  } catch (error) {
    logger.error("Error verifying access token:", error);
    throw error;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, refreshTokenSecret, {
      issuer: "stablebank",
      audience: "stablebank-users",
    });
  } catch (error) {
    logger.error("Error verifying refresh token:", error);
    throw error;
  }
}

async function storeRefreshToken(userId, refreshTokenId, deviceInfo = {}) {
  try {
    const sessionKey = `refresh_token:${refreshTokenId}`;
    const userSessionsKey = `user_sessions:${userId}`;

    const sessionData = {
      userId,
      refreshTokenId,
      deviceInfo,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    // Store the session data
    await redisClient.set(sessionKey, sessionData, 7 * 24 * 60 * 60); // 7 days

    // Add to user's active sessions list
    const userSessions = (await redisClient.get(userSessionsKey)) || [];
    userSessions.push(refreshTokenId);
    await redisClient.set(userSessionsKey, userSessions, 7 * 24 * 60 * 60);

    return refreshTokenId;
  } catch (error) {
    logger.error("Error storing refresh token:", error);
    throw error;
  }
}

async function validateRefreshToken(refreshTokenId) {
  try {
    const sessionKey = `refresh_token:${refreshTokenId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    // Update last used timestamp
    sessionData.lastUsed = new Date().toISOString();
    await redisClient.set(sessionKey, sessionData, 7 * 24 * 60 * 60);

    return sessionData;
  } catch (error) {
    logger.error("Error validating refresh token:", error);
    throw error;
  }
}

async function revokeRefreshToken(refreshTokenId, userId = null) {
  try {
    const sessionKey = `refresh_token:${refreshTokenId}`;

    // If userId is provided, remove from user's sessions list
    if (userId) {
      const userSessionsKey = `user_sessions:${userId}`;
      const userSessions = (await redisClient.get(userSessionsKey)) || [];
      const updatedSessions = userSessions.filter(
        (id) => id !== refreshTokenId
      );
      await redisClient.set(userSessionsKey, updatedSessions, 7 * 24 * 60 * 60);
    }

    // Remove the session
    await redisClient.del(sessionKey);

    return true;
  } catch (error) {
    logger.error("Error revoking refresh token:", error);
    throw error;
  }
}

async function revokeAllUserSessions(userId) {
  try {
    const userSessionsKey = `user_sessions:${userId}`;
    const userSessions = (await redisClient.get(userSessionsKey)) || [];

    // Revoke all sessions for the user
    for (const refreshTokenId of userSessions) {
      await revokeRefreshToken(refreshTokenId);
    }

    // Remove user sessions list
    await redisClient.del(userSessionsKey);

    return true;
  } catch (error) {
    logger.error("Error revoking all user sessions:", error);
    throw error;
  }
}

async function getUserSessions(userId) {
  try {
    const userSessionsKey = `user_sessions:${userId}`;
    const userSessions = (await redisClient.get(userSessionsKey)) || [];

    const sessions = [];
    for (const refreshTokenId of userSessions) {
      const sessionData = await redisClient.get(
        `refresh_token:${refreshTokenId}`
      );
      if (sessionData) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  } catch (error) {
    logger.error("Error getting user sessions:", error);
    throw error;
  }
}

function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  getUserSessions,
  extractTokenFromHeader,
};
