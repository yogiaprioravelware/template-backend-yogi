module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("inbound_receiving_log", [
      {
        inbound_item_id: 1,
        location_id: 1,
        qty_received: 10,
        received_at: new Date("2026-04-01 08:00:00"),
      },
      {
        inbound_item_id: 1,
        location_id: 2,
        qty_received: 10,
        received_at: new Date("2026-04-01 08:30:00"),
      },
      {
        inbound_item_id: 2,
        location_id: 1,
        qty_received: 25,
        received_at: new Date("2026-04-01 09:00:00"),
      },
      {
        inbound_item_id: 2,
        location_id: 3,
        qty_received: 25,
        received_at: new Date("2026-04-01 09:30:00"),
      },
      {
        inbound_item_id: 3,
        location_id: 2,
        qty_received: 15,
        received_at: new Date("2026-04-02 08:00:00"),
      },
      {
        inbound_item_id: 3,
        location_id: 4,
        qty_received: 10,
        received_at: new Date("2026-04-02 08:45:00"),
      },
      {
        inbound_item_id: 4,
        location_id: 1,
        qty_received: 10,
        received_at: new Date("2026-04-02 09:15:00"),
      },
      {
        inbound_item_id: 6,
        location_id: 3,
        qty_received: 5,
        received_at: new Date("2026-04-01 14:00:00"),
      },
      {
        inbound_item_id: 6,
        location_id: 4,
        qty_received: 5,
        received_at: new Date("2026-04-01 14:30:00"),
      },
      {
        inbound_item_id: 7,
        location_id: 2,
        qty_received: 25,
        received_at: new Date("2026-04-01 15:00:00"),
      },
      {
        inbound_item_id: 7,
        location_id: 3,
        qty_received: 25,
        received_at: new Date("2026-04-01 15:45:00"),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("inbound_receiving_log", null, {});
  },
};
