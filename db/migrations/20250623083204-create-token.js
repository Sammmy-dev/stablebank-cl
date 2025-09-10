"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("token", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      contractAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      decimals: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 18,
      },
      isStablecoin: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      priceFeedAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      logoUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      coingeckoId: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex("token", ["chainId", "contractAddress"], {
      unique: true,
    });
    await queryInterface.addIndex("token", ["symbol"]);
    await queryInterface.addIndex("token", ["isStablecoin"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("token");
  },
};
