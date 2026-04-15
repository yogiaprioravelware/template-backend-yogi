"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop staging tables
    try {
      await queryInterface.dropTable("staging_audit_logs");
      await queryInterface.dropTable("staging_items");
      await queryInterface.dropTable("staging_sessions");
      await queryInterface.dropTable("inbound_receiving_log");
    } catch (e) {
      console.warn(`Migration skip: Some staging tables might not exist. Details: ${e.message}`);
    }

    // Remove qty_staged from outbound_items if it exists
    try {
      const itemsDesc = await queryInterface.describeTable("outbound_items");
      if (itemsDesc.qty_staged) {
        await queryInterface.removeColumn("outbound_items", "qty_staged");
      }
    } catch (e) {
      console.warn(`Migration skip: Column 'qty_staged' might not exist in 'outbound_items'. Details: ${e.message}`);
    }
  },

  async down(queryInterface, Sequelize) {
    // Empty down migration because we are permanently dropping unused tables
  },
};
