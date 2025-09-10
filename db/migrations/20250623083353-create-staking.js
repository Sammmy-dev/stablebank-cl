"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("staking", {
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
      tokenId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "token",
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
      stakingType: {
        type: Sequelize.ENUM(
          "flexible",
          "locked_30",
          "locked_90",
          "locked_180",
          "locked_365"
        ),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
      },
      amountUSD: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      apy: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
      },
      lockPeriod: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      lockStartDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lockEndDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      totalRewardsEarned: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0,
      },
      totalRewardsUSD: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lastRewardCalculation: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      smartContractAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transactionHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex("staking", ["userId"]);
    await queryInterface.addIndex("staking", ["tokenId"]);
    await queryInterface.addIndex("staking", ["stakingType"]);
    await queryInterface.addIndex("staking", ["status"]);
    await queryInterface.addIndex("staking", ["lockEndDate"]);
    await queryInterface.addIndex("staking", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("staking");
  },
};
