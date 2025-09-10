const redis = require("redis");
const logger = require("./logger");

// Module-level state
let client = null;
let isConnected = false;

async function connect() {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error("Redis max reconnection attempts reached");
            return new Error("Redis max reconnection attempts reached");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on("error", (err) => {
      logger.error("Redis Client Error:", err);
      isConnected = false;
    });

    client.on("connect", () => {
      logger.info("Redis Client Connected");
      isConnected = true;
    });

    client.on("ready", () => {
      logger.info("Redis Client Ready");
      isConnected = true;
    });

    client.on("end", () => {
      logger.info("Redis Client Disconnected");
      isConnected = false;
    });

    await client.connect();
  } catch (error) {
    logger.error("Redis connection error:", error);
    throw error;
  }
}

async function disconnect() {
  if (client) {
    await client.quit();
    isConnected = false;
  }
}

async function set(key, value, ttl = null) {
  try {
    if (!isConnected) {
      throw new Error("Redis client not connected");
    }

    if (ttl) {
      await client.setEx(key, ttl, JSON.stringify(value));
    } else {
      await client.set(key, JSON.stringify(value));
    }
  } catch (error) {
    logger.error("Redis SET error:", error);
    throw error;
  }
}

async function get(key) {
  try {
    if (!isConnected) {
      throw new Error("Redis client not connected");
    }

    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error("Redis GET error:", error);
    throw error;
  }
}

async function del(key) {
  try {
    if (!isConnected) {
      throw new Error("Redis client not connected");
    }

    await client.del(key);
  } catch (error) {
    logger.error("Redis DEL error:", error);
    throw error;
  }
}

async function exists(key) {
  try {
    if (!isConnected) {
      throw new Error("Redis client not connected");
    }

    return await client.exists(key);
  } catch (error) {
    logger.error("Redis EXISTS error:", error);
    throw error;
  }
}

async function expire(key, seconds) {
  try {
    if (!isConnected) {
      throw new Error("Redis client not connected");
    }

    await client.expire(key, seconds);
  } catch (error) {
    logger.error("Redis EXPIRE error:", error);
    throw error;
  }
}

module.exports = {
  connect,
  disconnect,
  set,
  get,
  del,
  exists,
  expire,
};
