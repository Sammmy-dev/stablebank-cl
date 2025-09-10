"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("userSession", {
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
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
      },
      refreshToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      accessToken: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deviceId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deviceName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deviceType: {
        type: Sequelize.ENUM("mobile", "desktop", "tablet", "web"),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      isTrusted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      lastActivityAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revokedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "user",
          key: "id",
        },
      },
      revocationReason: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex("userSession", ["userId"]);
    await queryInterface.addIndex("userSession", ["sessionId"]);
    await queryInterface.addIndex("userSession", ["refreshToken"]);
    await queryInterface.addIndex("userSession", ["deviceId"]);
    await queryInterface.addIndex("userSession", ["isActive"]);
    await queryInterface.addIndex("userSession", ["expiresAt"]);
    await queryInterface.addIndex("userSession", ["lastActivityAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("userSession");
  },
};
