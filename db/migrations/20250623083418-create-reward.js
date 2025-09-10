"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reward", {
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
      type: {
        type: Sequelize.ENUM(
          "points",
          "cashback",
          "bonus",
          "referral",
          "staking_reward",
          "investment_reward"
        ),
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      tokenAmount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: true,
      },
      tokenId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "token",
          key: "id",
        },
      },
      status: {
        type: Sequelize.ENUM("pending", "credited", "claimed", "expired"),
        allowNull: false,
        defaultValue: "pending",
      },
      tier: {
        type: Sequelize.ENUM("bronze", "silver", "gold", "platinum", "diamond"),
        allowNull: true,
      },
      multiplier: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      claimedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex("reward", ["userId"]);
    await queryInterface.addIndex("reward", ["type"]);
    await queryInterface.addIndex("reward", ["action"]);
    await queryInterface.addIndex("reward", ["status"]);
    await queryInterface.addIndex("reward", ["tier"]);
    await queryInterface.addIndex("reward", ["expiresAt"]);
    await queryInterface.addIndex("reward", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("reward");
  },
};
