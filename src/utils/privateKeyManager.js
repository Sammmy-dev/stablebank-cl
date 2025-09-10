const redisClient = require("./redis");
const logger = require("./logger");

/**
 * Store user's decrypted private key in Redis
 * @param {string} userId - User ID
 * @param {string} privateKey - Decrypted private key
 * @param {number} expiry - Expiry time in seconds (default: 1 hour)
 */
async function storePrivateKey(userId, privateKey, expiry = 60 * 60) {
  try {
    const key = `user_private_key:${userId}`;
    await redisClient.set(key, privateKey, expiry);
    logger.info(`Private key stored for user ${userId}`);
  } catch (error) {
    logger.error("Error storing private key:", error);
    throw error;
  }
}

/**
 * Retrieve user's decrypted private key from Redis
 * @param {string} userId - User ID
 * @returns {string|null} - Decrypted private key or null if not found
 */
async function getPrivateKey(userId) {
  try {
    const key = `user_private_key:${userId}`;
    const privateKey = await redisClient.get(key);

    if (privateKey) {
      // Extend expiry by another hour
      await redisClient.set(key, privateKey, 60 * 60);
    }

    return privateKey;
  } catch (error) {
    logger.error("Error retrieving private key:", error);
    throw error;
  }
}

/**
 * Clear user's private key from Redis
 * @param {string} userId - User ID
 */
async function clearPrivateKey(userId) {
  try {
    const key = `user_private_key:${userId}`;
    await redisClient.del(key);
    logger.info(`Private key cleared for user ${userId}`);
  } catch (error) {
    logger.error("Error clearing private key:", error);
    throw error;
  }
}

/**
 * Check if user has a stored private key
 * @param {string} userId - User ID
 * @returns {boolean} - True if private key exists
 */
async function hasPrivateKey(userId) {
  try {
    const key = `user_private_key:${userId}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error("Error checking private key existence:", error);
    return false;
  }
}

module.exports = {
  storePrivateKey,
  getPrivateKey,
  clearPrivateKey,
  hasPrivateKey,
};
