module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("inbound_items", [
      {
        inbound_id: 1,
        sku_code: "SKU-LAPTOP-001",
        qty_target: 20,
        qty_received: 20,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 1,
        sku_code: "SKU-MOUSE-001",
        qty_target: 50,
        qty_received: 50,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 2,
        sku_code: "SKU-KEYBOARD-001",
        qty_target: 30,
        qty_received: 25,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 2,
        sku_code: "SKU-MONITOR-001",
        qty_target: 15,
        qty_received: 10,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 3,
        sku_code: "SKU-CABLE-001",
        qty_target: 100,
        qty_received: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 4,
        sku_code: "SKU-HEADPHONE-001",
        qty_target: 10,
        qty_received: 10,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 4,
        sku_code: "SKU-POWERBANK-001",
        qty_target: 50,
        qty_received: 50,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        inbound_id: 5,
        sku_code: "SKU-STAND-001",
        qty_target: 25,
        qty_received: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("inbound_items", null, {});
  },
};
