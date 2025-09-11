const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config();

// Database configuration
const config = {
  url: process.env.DATABASE_URL,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

async function runMigrations() {
  console.log("Starting database migrations...");

  try {
    // Create Sequelize instance
    const sequelize = new Sequelize(config);

    // Test connection
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Import and run migrations
    const migrationsPath = path.join(__dirname, "../db/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".js"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));

      if (typeof migration.up === "function") {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✅ Migration ${file} completed`);
      }
    }

    console.log("All migrations completed successfully!");
    await sequelize.close();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

