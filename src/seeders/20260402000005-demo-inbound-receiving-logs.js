"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch inbound_items and locations dynamically
    const [itemRows] = await queryInterface.sequelize.query(
      `SELECT id, inbound_id, sku_code from ${queryInterface.queryGenerator.quoteTable("inbound_items")};`
    );
    const [locRows] = await queryInterface.sequelize.query(
      `SELECT id, location_code from ${queryInterface.queryGenerator.quoteTable("locations")};`
    );

    if (itemRows.length > 0 && locRows.length > 0) {
      // Helper function to find ID by SKU/Code
      const findItemId = (sku) => {
          const row = itemRows.find(r => (r.sku_code || r.SKU_CODE) === sku);
          return row ? (row.id || row.ID) : null;
      };
      const findLocId = (code) => {
          const row = locRows.find(r => (r.location_code || r.LOCATION_CODE) === code);
          return row ? (row.id || row.ID) : null;
      };

      return queryInterface.bulkInsert("inbound_receiving_log", [
        {
          inbound_item_id: findItemId("SKU-LAPTOP-001"),
          location_id: findLocId("LOC-001"),
          qty_received: 10,
          received_at: new Date("2026-04-01 08:00:00"),
        },
        {
          inbound_item_id: findItemId("SKU-LAPTOP-001"),
          location_id: findLocId("LOC-002"),
          qty_received: 10,
          received_at: new Date("2026-04-01 08:30:00"),
        },
        {
          inbound_item_id: findItemId("SKU-MOUSE-001"),
          location_id: findLocId("LOC-001"),
          qty_received: 25,
          received_at: new Date("2026-04-01 09:00:00"),
        },
        {
          inbound_item_id: findItemId("SKU-MOUSE-001"),
          location_id: findLocId("LOC-003"),
          qty_received: 25,
          received_at: new Date("2026-04-01 09:30:00"),
        },
        {
          inbound_item_id: findItemId("SKU-KEYBOARD-001"),
          location_id: findLocId("LOC-002"),
          qty_received: 15,
          received_at: new Date("2026-04-02 08:00:00"),
        },
        {
          inbound_item_id: findItemId("SKU-KEYBOARD-001"),
          location_id: findLocId("LOC-004"),
          qty_received: 10,
          received_at: new Date("2026-04-02 08:45:00"),
        },
      ]);
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("inbound_receiving_log", null, {});
  },
};

