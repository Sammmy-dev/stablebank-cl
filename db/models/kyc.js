"use strict";
const { DataTypes } = require("sequelize");
const path = require("path");

// Get sequelize instance from config
const config = require(path.join(__dirname, "../../config/config.js"));
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

module.exports = sequelize.define(
  "KYC",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "id",
      },
    },
    kycReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "External KYC provider reference",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "under_review"),
      allowNull: false,
      defaultValue: "pending",
    },
    provider: {
      type: DataTypes.ENUM("sumsub", "persona", "manual"),
      allowNull: false,
      defaultValue: "sumsub",
    },
    documentType: {
      type: DataTypes.ENUM(
        "passport",
        "national_id",
        "drivers_license",
        "utility_bill"
      ),
      allowNull: true,
    },
    documentNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    documentExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Structured address data",
    },
    idFrontUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 URL for ID front image",
    },
    idBackUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 URL for ID back image",
    },
    selfieUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 URL for selfie image",
    },
    proofOfAddressUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 URL for proof of address",
    },
    providerData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Raw data from KYC provider",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
      comment: "Admin who reviewed the KYC",
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
  },
  {
    paranoid: true,
    freezeTableName: true,
    modelName: "KYC",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["kycReference"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["provider"],
      },
      {
        fields: ["submittedAt"],
      },
    ],
  }
);
