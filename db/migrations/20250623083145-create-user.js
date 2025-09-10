"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      bankTag: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isPhoneVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is2FAEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      twoFactorSecret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otpExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      kycStatus: {
        type: Sequelize.ENUM("pending", "approved", "rejected", "not_started"),
        defaultValue: "not_started",
      },
      kycReference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM("user", "admin", "moderator"),
        defaultValue: "user",
      },
      status: {
        type: Sequelize.ENUM("active", "suspended", "banned"),
        defaultValue: "active",
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      referralCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referredBy: {
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
      encryptedPrivateKey: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "AES-256 encrypted user private key",
      },
      privateKeySalt: {
        type: Sequelize.STRING,
        allowNull: true,
        comment:
          "Salt used for PBKDF2 key derivation for private key encryption",
      },
      privateKeyIv: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "IV used for AES-256 encryption of private key",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user");
  },
};
