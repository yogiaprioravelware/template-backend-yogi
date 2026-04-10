"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ambil ID dinamis
    const items = await queryInterface.sequelize.query(
      `SELECT id, created_at, sku_code from ${queryInterface.queryGenerator.quoteTable("items")};`
    );
    const locations = await queryInterface.sequelize.query(
      `SELECT id from ${queryInterface.queryGenerator.quoteTable("locations")};`
    );

    const itemRows = items[0];
    const locRows = locations[0];

    if (itemRows.length > 0 && locRows.length > 0) {
      // Buat tanggal mundur (masa lalu)
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      return queryInterface.bulkInsert("inventory_movements", [
        // Laptop (ID 0)
        {
          item_id: itemRows[0].id,
          location_id: locRows[0].id, // Rak Loc 1
          type: "INBOUND",
          qty_change: 10,
          balance_after: 10,
          reference_id: "PO-2026-001",
          operator_name: "admin",
          created_at: threeDaysAgo,
          updated_at: threeDaysAgo,
        },
        {
          item_id: itemRows[0].id,
          location_id: locRows[0].id, // Rak Loc 1
          type: "INBOUND",
          qty_change: 25, // jadi 35
          balance_after: 35,
          reference_id: "PO-2026-002",
          operator_name: "alpha_operator",
          created_at: twoDaysAgo,
          updated_at: twoDaysAgo,
        },
        {
          item_id: itemRows[0].id,
          location_id: locRows[0].id, // Rak Loc 1
          type: "OUTBOUND",
          qty_change: -5, // sisa 30 (sesuai seed)
          balance_after: 30,
          reference_id: "ORD-101",
          operator_name: "alpha_operator",
          created_at: yesterday,
          updated_at: yesterday,
        },
        // Laptop di Loc 2
        {
          item_id: itemRows[0].id,
          location_id: locRows[1].id,
          type: "INBOUND",
          qty_change: 20, // sesuai seed
          balance_after: 20,
          reference_id: "PO-2026-003",
          operator_name: "alpha_operator",
          created_at: fiveHoursAgo,
          updated_at: fiveHoursAgo,
        },

        // Mouse di Loc 3
        {
          item_id: itemRows[1].id,
          location_id: locRows[2].id,
          type: "INBOUND",
          qty_change: 200,
          balance_after: 200,
          reference_id: "PO-2026-001",
          operator_name: "admin",
          created_at: threeDaysAgo,
          updated_at: threeDaysAgo,
        },
        {
          item_id: itemRows[1].id,
          location_id: locRows[2].id,
          type: "OUTBOUND",
          qty_change: -40,
          balance_after: 160,
          reference_id: "ORD-109",
          operator_name: "beta_operator",
          created_at: twoDaysAgo,
          updated_at: twoDaysAgo,
        },
        {
          item_id: itemRows[1].id,
          location_id: locRows[2].id,
          type: "MANUAL_ADJUSTMENT",
          qty_change: -10, // Stock opname minus
          balance_after: 150, // sisa 150 (sesuai seed)
          reference_id: "OPNAME-OCT-01",
          operator_name: "supervisor_charlie",
          created_at: yesterday,
          updated_at: yesterday,
        },

        // Keyboard di Loc 1 (40) dan Loc 4 (40)
        {
          item_id: itemRows[2].id,
          location_id: locRows[0].id,
          type: "INBOUND",
          qty_change: 40, // sesuai seed
          balance_after: 40,
          reference_id: "PO-SUPPLIER-X",
          operator_name: "admin",
          created_at: yesterday,
          updated_at: yesterday,
        },
        {
          item_id: itemRows[2].id,
          location_id: locRows[3].id,
          type: "INBOUND",
          qty_change: 40, // sesuai seed
          balance_after: 40,
          reference_id: "PO-SUPPLIER-Y",
          operator_name: "beta_operator",
          created_at: twoHoursAgo,
          updated_at: twoHoursAgo,
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("inventory_movements", null, {});
  },
};
