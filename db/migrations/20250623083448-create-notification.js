"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notification", {
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
        type: Sequelize.ENUM("email", "sms", "push", "in_app"),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          "transaction",
          "security",
          "reward",
          "investment",
          "kyc",
          "system",
          "marketing"
        ),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "sent", "delivered", "failed", "read"),
        allowNull: false,
        defaultValue: "pending",
      },
      priority: {
        type: Sequelize.ENUM("low", "normal", "high", "urgent"),
        allowNull: false,
        defaultValue: "normal",
      },
      provider: {
        type: Sequelize.ENUM("sendgrid", "twilio", "firebase", "internal"),
        allowNull: true,
      },
      providerId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      recipient: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      expiresAt: {
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
    await queryInterface.addIndex("notification", ["userId"]);
    await queryInterface.addIndex("notification", ["type"]);
    await queryInterface.addIndex("notification", ["category"]);
    await queryInterface.addIndex("notification", ["status"]);
    await queryInterface.addIndex("notification", ["priority"]);
    await queryInterface.addIndex("notification", ["sentAt"]);
    await queryInterface.addIndex("notification", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("notification");
  },
};
