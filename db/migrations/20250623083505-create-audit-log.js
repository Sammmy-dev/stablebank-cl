"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("auditLog", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "user",
          key: "id",
        },
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      resource: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resourceId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("success", "failure", "pending"),
        allowNull: false,
        defaultValue: "success",
      },
      severity: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "low",
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      requestId: {
        type: Sequelize.UUID,
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
    await queryInterface.addIndex("auditLog", ["userId"]);
    await queryInterface.addIndex("auditLog", ["action"]);
    await queryInterface.addIndex("auditLog", ["resource"]);
    await queryInterface.addIndex("auditLog", ["status"]);
    await queryInterface.addIndex("auditLog", ["severity"]);
    await queryInterface.addIndex("auditLog", ["ipAddress"]);
    await queryInterface.addIndex("auditLog", ["createdAt"]);
    await queryInterface.addIndex("auditLog", ["sessionId"]);
    await queryInterface.addIndex("auditLog", ["requestId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("auditLog");
  },
};
