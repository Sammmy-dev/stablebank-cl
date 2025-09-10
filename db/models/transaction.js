"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

module.exports = sequelize.define(
  "transaction",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    transactionHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "On-chain transaction hash",
    },
    internalId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      comment: "Internal transaction ID for tracking",
    },
    type: {
      type: DataTypes.ENUM(
        "transfer",
        "cross_chain",
        "stake",
        "unstake",
        "investment",
        "withdrawal",
        "card_payment"
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    fromUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "id",
      },
    },
    toUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
    },
    fromWalletId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "wallet",
        key: "id",
      },
    },
    toWalletId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "wallet",
        key: "id",
      },
    },
    fromAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fromBankTag: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Sender BankTag if transfer was by tag",
    },
    toBankTag: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Recipient BankTag if transfer was by tag",
    },
    tokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "token",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      comment: "Raw token amount",
    },
    amountUSD: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: "Amount in USD equivalent",
    },
    fee: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0,
      comment: "Transaction fee in tokens",
    },
    feeUSD: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Transaction fee in USD",
    },
    fromChainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Source chain ID",
    },
    toChainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Destination chain ID",
    },
    deBridgeId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "DeBridge cross-chain transfer ID",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional transaction metadata",
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.TEXT,
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
    modelName: "transaction",
    indexes: [
      {
        fields: ["transactionHash"],
      },
      {
        fields: ["internalId"],
      },
      {
        fields: ["fromUserId"],
      },
      {
        fields: ["toUserId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["fromBankTag"],
      },
      {
        fields: ["toBankTag"],
      },
    ],
  }
);
