"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("virtualCard", {
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
      cardId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      cardNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastFour: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      expiryMonth: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expiryYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cvv: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "suspended", "terminated", "pending"),
        allowNull: false,
        defaultValue: "pending",
      },
      cardType: {
        type: Sequelize.ENUM("virtual", "physical"),
        allowNull: false,
        defaultValue: "virtual",
      },
      spendingLimit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      monthlyLimit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "USD",
      },
      isInternational: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      merchantCategories: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      issuedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      terminatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      terminatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "user",
          key: "id",
        },
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
    await queryInterface.addIndex("virtualCard", ["userId"]);
    await queryInterface.addIndex("virtualCard", ["cardId"]);
    await queryInterface.addIndex("virtualCard", ["status"]);
    await queryInterface.addIndex("virtualCard", ["cardType"]);
    await queryInterface.addIndex("virtualCard", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("virtualCard");
  },
};
