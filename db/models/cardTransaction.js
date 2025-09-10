"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "cardTransaction",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    virtualCardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "virtualCards",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "id",
      },
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "External transaction ID from card provider",
    },
    type: {
      type: DataTypes.ENUM("purchase", "refund", "chargeback", "fee", "load"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "declined", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: "Transaction amount in card currency",
    },
    amountUSD: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: "Transaction amount in USD",
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "USD",
    },
    merchantName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchantId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchantCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Merchant category code (MCC)",
    },
    merchantCategoryDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Merchant location data",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    authorizationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardLastFour: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional transaction metadata",
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    settledAt: {
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
    modelName: "cardTransaction",
    indexes: [
      {
        fields: ["virtualCardId"],
      },
      {
        fields: ["userId"],
      },
      {
        fields: ["transactionId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["merchantCategory"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
