"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove phone number related columns from user table
    await queryInterface.removeColumn("user", "phoneNumber");
    await queryInterface.removeColumn("user", "isPhoneVerified");
  },

  async down(queryInterface, Sequelize) {
    // Add back phone number related columns to user table
    await queryInterface.addColumn("user", "phoneNumber", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    await queryInterface.addColumn("user", "isPhoneVerified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
};
