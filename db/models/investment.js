"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

module.exports = sequelize.define(
  "investment",
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
    investmentType: {
      type: DataTypes.ENUM("aim", "synthetic_stock", "custom"),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Investment plan name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "paused", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "active",
    },
    // AIM specific fields
    aimFrequency: {
      type: DataTypes.ENUM("daily", "weekly", "monthly"),
      allowNull: true,
    },
    aimAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Amount to invest per frequency in USD",
    },
    aimTokenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "token",
        key: "id",
      },
    },
    // Synthetic stock specific fields
    stockSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Stock symbol (e.g., AAPL, GOOGL)",
    },
    stockName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    synthetixAssetId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Synthetix synthetic asset identifier",
    },
    // General investment fields
    totalInvested: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Total amount invested in USD",
    },
    currentValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Current investment value in USD",
    },
    totalReturn: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Total return (profit/loss) in USD",
    },
    returnPercentage: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: false,
      defaultValue: 0,
      comment: "Return percentage",
    },
    lastInvestmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextInvestmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    smartContractAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Smart contract address for this investment",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional investment metadata",
    },
    pausedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: "investment",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["investmentType"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["stockSymbol"],
      },
      {
        fields: ["nextInvestmentDate"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
