"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "token",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Token symbol (USDC, USDT, DAI, etc.)",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Full token name",
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Chain ID where this token exists",
    },
    contractAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [42, 42], // Ethereum address length
      },
    },
    decimals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 18,
    },
    isStablecoin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    priceFeedAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Chainlink price feed address",
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coingeckoId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "CoinGecko API identifier",
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
    modelName: "token",
    indexes: [
      {
        unique: true,
        fields: ["chainId", "contractAddress"],
      },
      {
        fields: ["symbol"],
      },
      {
        fields: ["isStablecoin"],
      },
    ],
  }
);
