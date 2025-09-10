"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cardTransaction", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      virtualCardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "virtualCard",
          key: "id",
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM("purchase", "refund", "chargeback", "fee", "load"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "completed", "declined", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      amountUSD: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "USD",
      },
      merchantName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantCategory: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantCategoryDescription: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      authorizationCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cardLastFour: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      settledAt: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex("cardTransaction", ["virtualCardId"]);
    await queryInterface.addIndex("cardTransaction", ["userId"]);
    await queryInterface.addIndex("cardTransaction", ["transactionId"]);
    await queryInterface.addIndex("cardTransaction", ["status"]);
    await queryInterface.addIndex("cardTransaction", ["type"]);
    await queryInterface.addIndex("cardTransaction", ["merchantCategory"]);
    await queryInterface.addIndex("cardTransaction", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cardTransaction");
  },
};
