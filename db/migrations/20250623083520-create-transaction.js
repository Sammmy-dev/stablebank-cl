"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transaction", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      transactionHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      internalId: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM(
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
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      toUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "user",
          key: "id",
        },
      },
      fromWalletId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "wallet",
          key: "id",
        },
      },
      toWalletId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "wallet",
          key: "id",
        },
      },
      fromAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      toAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fromBankTag: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      toBankTag: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tokenId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "token",
          key: "id",
        },
      },
      amount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
      },
      amountUSD: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      fee: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0,
      },
      feeUSD: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      fromChainId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      toChainId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      deBridgeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      confirmedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("transaction", ["transactionHash"]);
    await queryInterface.addIndex("transaction", ["internalId"]);
    await queryInterface.addIndex("transaction", ["fromUserId"]);
    await queryInterface.addIndex("transaction", ["toUserId"]);
    await queryInterface.addIndex("transaction", ["status"]);
    await queryInterface.addIndex("transaction", ["type"]);
    await queryInterface.addIndex("transaction", ["createdAt"]);
    await queryInterface.addIndex("transaction", ["fromBankTag"]);
    await queryInterface.addIndex("transaction", ["toBankTag"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transaction");
  },
};
