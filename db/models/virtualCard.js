"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "virtualCard",
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
    cardId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "External card provider ID (Lithic)",
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Masked card number",
    },
    lastFour: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    expiryMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12,
      },
    },
    expiryYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cvv: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Temporary CVV for display",
    },
    status: {
      type: DataTypes.ENUM("active", "suspended", "terminated", "pending"),
      allowNull: false,
      defaultValue: "pending",
    },
    cardType: {
      type: DataTypes.ENUM("virtual", "physical"),
      allowNull: false,
      defaultValue: "virtual",
    },
    spendingLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Daily spending limit in USD",
    },
    monthlyLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Monthly spending limit in USD",
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Current card balance in USD",
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "USD",
    },
    isInternational: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    merchantCategories: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Allowed/blocked merchant categories",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional card metadata",
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    terminatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    terminatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
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
    modelName: "virtualCard",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["cardId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["cardType"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
