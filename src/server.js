require("dotenv").config();
const app = require("./app");
// const { sequelize } = require("./models");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    // await sequelize.authenticate();
    // logger.info("Database connection has been established successfully.");

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
