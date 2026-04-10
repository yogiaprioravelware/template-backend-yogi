"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ambil ID inbounds secara dinamis
    const [inboundRows] = await queryInterface.sequelize.query(
      `SELECT id, po_number from ${queryInterface.queryGenerator.quoteTable("inbounds")};`
    );

    if (inboundRows.length > 0) {
      // Mapping PO Number ke ID untuk mempermudah seed
      const poMap = {};
      inboundRows.forEach(row => {
        poMap[row.po_number || row.PO_NUMBER] = row.id || row.ID;
      });

      return queryInterface.bulkInsert("inbound_items", [
        {
          inbound_id: poMap["PO-2026-001"],
          sku_code: "SKU-LAPTOP-001",
          qty_target: 20,
          qty_received: 20,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-001"],
          sku_code: "SKU-MOUSE-001",
          qty_target: 50,
          qty_received: 50,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-002"],
          sku_code: "SKU-KEYBOARD-001",
          qty_target: 30,
          qty_received: 25,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-002"],
          sku_code: "SKU-MONITOR-001",
          qty_target: 15,
          qty_received: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-003"],
          sku_code: "SKU-CABLE-001",
          qty_target: 100,
          qty_received: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-004"],
          sku_code: "SKU-HEADPHONE-001",
          qty_target: 10,
          qty_received: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-004"],
          sku_code: "SKU-POWERBANK-001",
          qty_target: 50,
          qty_received: 50,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          inbound_id: poMap["PO-2026-005"],
          sku_code: "SKU-STAND-001",
          qty_target: 25,
          qty_received: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("inbound_items", null, {});
  },
};

