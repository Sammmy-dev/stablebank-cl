"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Allow NULL for non-essential fields on user table
    await queryInterface.changeColumn("user", "firstName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("user", "lastName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("user", "isEmailVerified", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.changeColumn("user", "is2FAEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.changeColumn("user", "kycStatus", {
      type: Sequelize.ENUM("pending", "approved", "rejected", "not_started"),
      allowNull: true,
      defaultValue: "not_started",
    });
    await queryInterface.changeColumn("user", "role", {
      type: Sequelize.ENUM("user", "admin", "moderator"),
      allowNull: true,
      defaultValue: "user",
    });
    await queryInterface.changeColumn("user", "status", {
      type: Sequelize.ENUM("active", "suspended", "banned"),
      allowNull: true,
      defaultValue: "active",
    });
    await queryInterface.changeColumn("user", "totalPoints", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.changeColumn("user", "tier", {
      type: Sequelize.ENUM("bronze", "silver", "gold", "platinum", "diamond"),
      allowNull: true,
      defaultValue: "bronze",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to NOT NULL where originally enforced
    await queryInterface.changeColumn("user", "firstName", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("user", "lastName", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("user", "isEmailVerified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.changeColumn("user", "is2FAEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.changeColumn("user", "kycStatus", {
      type: Sequelize.ENUM("pending", "approved", "rejected", "not_started"),
      allowNull: false,
      defaultValue: "not_started",
    });
    await queryInterface.changeColumn("user", "role", {
      type: Sequelize.ENUM("user", "admin", "moderator"),
      allowNull: false,
      defaultValue: "user",
    });
    await queryInterface.changeColumn("user", "status", {
      type: Sequelize.ENUM("active", "suspended", "banned"),
      allowNull: false,
      defaultValue: "active",
    });
    await queryInterface.changeColumn("user", "totalPoints", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.changeColumn("user", "tier", {
      type: Sequelize.ENUM("bronze", "silver", "gold", "platinum", "diamond"),
      allowNull: false,
      defaultValue: "bronze",
    });
  },
};

