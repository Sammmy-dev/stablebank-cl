"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "reward",
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
      type: DataTypes.ENUM(
        "points",
        "cashback",
        "bonus",
        "referral",
        "staking_reward",
        "investment_reward"
      ),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment:
        'Action that triggered the reward (e.g., "daily_login", "transaction", "referral")',
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Points earned/spent",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Reward amount in USD",
    },
    tokenAmount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: true,
      comment: "Reward amount in tokens",
    },
    tokenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "token",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "credited", "claimed", "expired"),
      allowNull: false,
      defaultValue: "pending",
    },
    tier: {
      type: DataTypes.ENUM("bronze", "silver", "gold", "platinum", "diamond"),
      allowNull: true,
      comment: "User tier when reward was earned",
    },
    multiplier: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.0,
      comment: "Reward multiplier based on tier",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional reward metadata",
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
    modelName: "reward",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["action"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["tier"],
      },
      {
        fields: ["expiresAt"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
