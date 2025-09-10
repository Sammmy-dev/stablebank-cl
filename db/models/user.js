"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const bcrypt = require("bcryptjs");

module.exports = sequelize.define(
  "user",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        const hashPassword = bcrypt.hashSync(value, 10);
        this.setDataValue("password", hashPassword);
      },
    },
    confirmPassword: {
      type: DataTypes.VIRTUAL,
      set(value) {
        if (value !== this.getDataValue("_previousPassword")) {
          throw new Error("Password and confirm password must be the same");
        }
      },
    },
    bankTag: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    is2FAEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    kycStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "not_started"),
      allowNull: true,
      defaultValue: "not_started",
    },
    kycReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "moderator"),
      allowNull: true,
      defaultValue: "user",
    },
    status: {
      type: DataTypes.ENUM("active", "suspended", "banned"),
      allowNull: true,
      defaultValue: "active",
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    referralCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referredBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Total points earned by the user",
    },
    tier: {
      type: DataTypes.ENUM("bronze", "silver", "gold", "platinum", "diamond"),
      allowNull: true,
      defaultValue: "bronze",
      comment: "User tier based on total points",
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    deletedAt: {
      type: DataTypes.DATE,
    },
    encryptedPrivateKey: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "AES-256 encrypted user private key",
    },
    privateKeySalt: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Salt used for PBKDF2 key derivation for private key encryption",
    },
    privateKeyIv: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "IV used for AES-256 encryption of private key",
    },
  },
  {
    paranoid: true, //enables soft delete
    freezeTableName: true,
    modelName: "user",
  }
);
