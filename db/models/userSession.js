"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

module.exports = sequelize.define(
  "userSession",
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
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Current JWT access token",
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Unique device identifier",
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Human readable device name",
    },
    deviceType: {
      type: DataTypes.ENUM("mobile", "desktop", "tablet", "web"),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Geolocation data",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isTrusted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Whether this is a trusted device",
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
    },
    revocationReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional session metadata",
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
    modelName: "userSession",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["sessionId"],
      },
      {
        fields: ["refreshToken"],
      },
      {
        fields: ["deviceId"],
      },
      {
        fields: ["isActive"],
      },
      {
        fields: ["expiresAt"],
      },
      {
        fields: ["lastActivityAt"],
      },
    ],
  }
);
