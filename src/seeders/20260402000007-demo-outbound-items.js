module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("outbound_items", [
      {
        outbound_id: 1,
        sku_code: "SKU-LAPTOP-001",
        qty_target: 5,
        qty_delivered: 5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 1,
        sku_code: "SKU-MOUSE-001",
        qty_target: 10,
        qty_delivered: 10,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 2,
        sku_code: "SKU-KEYBOARD-001",
        qty_target: 8,
        qty_delivered: 5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 2,
        sku_code: "SKU-MONITOR-001",
        qty_target: 3,
        qty_delivered: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 3,
        sku_code: "SKU-CABLE-001",
        qty_target: 20,
        qty_delivered: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 4,
        sku_code: "SKU-HEADPHONE-001",
        qty_target: 4,
        qty_delivered: 4,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 4,
        sku_code: "SKU-POWERBANK-001",
        qty_target: 15,
        qty_delivered: 15,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        outbound_id: 5,
        sku_code: "SKU-STAND-001",
        qty_target: 10,
        qty_delivered: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("outbound_items", null, {});
  },
};
