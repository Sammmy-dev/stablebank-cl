"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("balance", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      walletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "wallet",
          key: "id",
        },
      },
      tokenId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "token",
          key: "id",
        },
      },
      balance: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0,
      },
      balanceUSD: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lastUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      isLocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      lockedAmount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex(
      "balance",
      ["userId", "walletId", "tokenId"],
      { unique: true }
    );
    await queryInterface.addIndex("balance", ["userId"]);
    await queryInterface.addIndex("balance", ["lastUpdatedAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("balance");
  },
};
