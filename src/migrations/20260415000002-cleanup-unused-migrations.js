"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop staging tables
    await queryInterface.dropTable("staging_audit_logs").catch(() => {});
    await queryInterface.dropTable("staging_items").catch(() => {});
    await queryInterface.dropTable("staging_sessions").catch(() => {});

    // Drop unused receiving log table
    await queryInterface.dropTable("inbound_receiving_log").catch(() => {});

    // Remove qty_staged from outbound_items if it exists
    try {
      const itemsDesc = await queryInterface.describeTable("outbound_items");
      if (itemsDesc.qty_staged) {
        await queryInterface.removeColumn("outbound_items", "qty_staged");
      }
    } catch (e) {
      console.warn("Migration skip: Column 'qty_staged' might not exist in 'outbound_items'.");
    }
  },

  async down(queryInterface, Sequelize) {
    // Empty down migration because we are permanently dropping unused tables
  },
};
