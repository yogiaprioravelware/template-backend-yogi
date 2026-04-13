"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch outbound IDs dynamically
    const [outboundRows] = await queryInterface.sequelize.query(
      `SELECT id, order_number from ${queryInterface.queryGenerator.quoteTable("outbounds")};`
    );

    if (outboundRows.length > 0) {
      // Mapping Order Number to ID
      const orderMap = {};
      outboundRows.forEach(row => {
        orderMap[row.order_number || row.ORDER_NUMBER] = row.id || row.ID;
      });

      return queryInterface.bulkInsert("outbound_items", [
        {
          outbound_id: orderMap["ORD-2026-001"],
          sku_code: "SKU-LAPTOP-001",
          qty_target: 5,
          qty_delivered: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-001"],
          sku_code: "SKU-MOUSE-001",
          qty_target: 10,
          qty_delivered: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-002"],
          sku_code: "SKU-KEYBOARD-001",
          qty_target: 8,
          qty_delivered: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-002"],
          sku_code: "SKU-MONITOR-001",
          qty_target: 3,
          qty_delivered: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-003"],
          sku_code: "SKU-CABLE-001",
          qty_target: 20,
          qty_delivered: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-004"],
          sku_code: "SKU-HEADPHONE-001",
          qty_target: 4,
          qty_delivered: 4,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-004"],
          sku_code: "SKU-POWERBANK-001",
          qty_target: 15,
          qty_delivered: 15,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          outbound_id: orderMap["ORD-2026-005"],
          sku_code: "SKU-STAND-001",
          qty_target: 10,
          qty_delivered: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("outbound_items", null, {});
  },
};

