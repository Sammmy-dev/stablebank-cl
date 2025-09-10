"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "wallet",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "id",
      },
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Chain ID (1 for Ethereum, 137 for Polygon, etc.)",
    },
    chainName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Human readable chain name",
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [42, 42], // Ethereum address length
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    deletedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    paranoid: true,
    freezeTableName: true,
    modelName: "wallet",
    indexes: [
      {
        unique: true,
        fields: ["userId", "chainId", "address"],
      },
      {
        fields: ["address"],
      },
    ],
  }
);
