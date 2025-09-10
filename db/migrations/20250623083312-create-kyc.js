"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("KYC", {
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
      kycReference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected", "under_review"),
        allowNull: false,
        defaultValue: "pending",
      },
      provider: {
        type: Sequelize.ENUM("sumsub", "persona", "manual"),
        allowNull: false,
        defaultValue: "sumsub",
      },
      documentType: {
        type: Sequelize.ENUM(
          "passport",
          "national_id",
          "drivers_license",
          "utility_bill"
        ),
        allowNull: true,
      },
      documentNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documentExpiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      idFrontUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      idBackUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      selfieUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      proofOfAddressUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      providerData: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "user",
          key: "id",
        },
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      submittedAt: {
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
    await queryInterface.addIndex("KYC", ["userId"]);
    await queryInterface.addIndex("KYC", ["kycReference"]);
    await queryInterface.addIndex("KYC", ["status"]);
    await queryInterface.addIndex("KYC", ["provider"]);
    await queryInterface.addIndex("KYC", ["submittedAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("KYC");
  },
};
