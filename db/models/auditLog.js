"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "auditLog",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
      comment: "User who performed the action (null for system actions)",
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment:
        'Action performed (e.g., "user_login", "transaction_create", "kyc_approve")',
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Resource affected (e.g., "user", "transaction", "kyc")',
    },
    resourceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID of the affected resource",
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Geolocation data",
    },
    status: {
      type: DataTypes.ENUM("success", "failure", "pending"),
      allowNull: false,
      defaultValue: "success",
    },
    severity: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      allowNull: false,
      defaultValue: "low",
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional action details",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Error message if action failed",
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "User session ID if applicable",
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Request ID for tracking",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional audit metadata",
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
    modelName: "auditLog",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["action"],
      },
      {
        fields: ["resource"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["severity"],
      },
      {
        fields: ["ipAddress"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["sessionId"],
      },
      {
        fields: ["requestId"],
      },
    ],
  }
);
