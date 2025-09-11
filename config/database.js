const { Sequelize } = require("sequelize");
const config = require("./config");
// require("dotenv").config();

const env = process.env.NODE_ENV || "production";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize;
