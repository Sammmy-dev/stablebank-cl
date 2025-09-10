"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("user", "totalPoints", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Total points earned by the user",
    });

    await queryInterface.addColumn("user", "tier", {
      type: Sequelize.ENUM("bronze", "silver", "gold", "platinum", "diamond"),
      allowNull: false,
      defaultValue: "bronze",
      comment: "User tier based on total points",
    });

    // Add indexes for better performance
    await queryInterface.addIndex("user", ["totalPoints"], {
      name: "idx_user_total_points",
    });

    await queryInterface.addIndex("user", ["tier"], {
      name: "idx_user_tier",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("user", "idx_user_total_points");
    await queryInterface.removeIndex("user", "idx_user_tier");
    await queryInterface.removeColumn("user", "tier");
    await queryInterface.removeColumn("user", "totalPoints");
  },
};
