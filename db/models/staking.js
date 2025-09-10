"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

module.exports = sequelize.define(
  "staking",
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
    tokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "token",
        key: "id",
      },
    },
    walletId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "wallet",
        key: "id",
      },
    },
    stakingType: {
      type: DataTypes.ENUM(
        "flexible",
        "locked_30",
        "locked_90",
        "locked_180",
        "locked_365"
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      comment: "Staked amount in tokens",
    },
    amountUSD: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: "Staked amount in USD",
    },
    apy: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: false,
      comment: "Annual percentage yield at time of staking",
    },
    lockPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Lock period in days (null for flexible)",
    },
    lockStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lockEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "active",
    },
    totalRewardsEarned: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0,
      comment: "Total rewards earned in tokens",
    },
    totalRewardsUSD: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Total rewards earned in USD",
    },
    lastRewardCalculation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    smartContractAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Smart contract address for this staking",
    },
    transactionHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "On-chain staking transaction hash",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional staking metadata",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
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
    modelName: "staking",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["tokenId"],
      },
      {
        fields: ["stakingType"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["lockEndDate"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
