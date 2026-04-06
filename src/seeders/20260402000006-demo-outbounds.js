module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("outbounds", [
      {
        order_number: "ORD-2026-001",
        outbound_type: "LUNAS",
        status: "DONE",
        created_at: new Date("2026-04-01"),
        updated_at: new Date("2026-04-01"),
      },
      {
        order_number: "ORD-2026-002",
        outbound_type: "PINJAM",
        status: "PROCES",
        created_at: new Date("2026-04-02"),
        updated_at: new Date("2026-04-02"),
      },
      {
        order_number: "ORD-2026-003",
        outbound_type: "RETURN",
        status: "PENDING",
        created_at: new Date("2026-04-02"),
        updated_at: new Date("2026-04-02"),
      },
      {
        order_number: "ORD-2026-004",
        outbound_type: "LUNAS",
        status: "DONE",
        created_at: new Date("2026-04-01"),
        updated_at: new Date("2026-04-01"),
      },
      {
        order_number: "ORD-2026-005",
        outbound_type: "PINJAM",
        status: "PENDING",
        created_at: new Date("2026-04-02"),
        updated_at: new Date("2026-04-02"),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("outbounds", null, {});
  },
};
