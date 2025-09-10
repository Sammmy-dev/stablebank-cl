"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "notification",
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
    type: {
      type: DataTypes.ENUM("email", "sms", "push", "in_app"),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "transaction",
        "security",
        "reward",
        "investment",
        "kyc",
        "system",
        "marketing"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "sent", "delivered", "failed", "read"),
      allowNull: false,
      defaultValue: "pending",
    },
    priority: {
      type: DataTypes.ENUM("low", "normal", "high", "urgent"),
      allowNull: false,
      defaultValue: "normal",
    },
    provider: {
      type: DataTypes.ENUM("sendgrid", "twilio", "firebase", "internal"),
      allowNull: true,
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "External provider message ID",
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Email address or phone number",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional notification metadata",
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    expiresAt: {
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
    modelName: "notification",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["category"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["priority"],
      },
      {
        fields: ["sentAt"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
