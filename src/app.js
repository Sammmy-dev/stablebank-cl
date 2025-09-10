const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");
const redisClient = require("./utils/redis");
const logger = require("./utils/logger");

const app = express();

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis connection established successfully");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    // Don't throw error to allow app to start without Redis in development
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
};

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/v1", routes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  await redisClient.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  await redisClient.disconnect();
  process.exit(0);
});

// Initialize Redis when app starts
initializeRedis();

module.exports = app;
