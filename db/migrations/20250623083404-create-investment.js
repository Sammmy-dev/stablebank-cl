"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("investment", {
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
      investmentType: {
        type: Sequelize.ENUM("aim", "synthetic_stock", "custom"),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "paused", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      aimFrequency: {
        type: Sequelize.ENUM("daily", "weekly", "monthly"),
        allowNull: true,
      },
      aimAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      aimTokenId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "token",
          key: "id",
        },
      },
      stockSymbol: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stockName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      synthetixAssetId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      totalInvested: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currentValue: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalReturn: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      returnPercentage: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0,
      },
      lastInvestmentDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextInvestmentDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      smartContractAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      pausedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelledAt: {
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
    await queryInterface.addIndex("investment", ["userId"]);
    await queryInterface.addIndex("investment", ["investmentType"]);
    await queryInterface.addIndex("investment", ["status"]);
    await queryInterface.addIndex("investment", ["stockSymbol"]);
    await queryInterface.addIndex("investment", ["nextInvestmentDate"]);
    await queryInterface.addIndex("investment", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("investment");
  },
};
