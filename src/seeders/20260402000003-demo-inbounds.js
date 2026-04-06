module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("inbounds", [
      {
        po_number: "PO-2026-001",
        status: "DONE",
        created_at: new Date("2026-04-01"),
        updated_at: new Date("2026-04-01"),
      },
      {
        po_number: "PO-2026-002",
        status: "PROCES",
        created_at: new Date("2026-04-02"),
        updated_at: new Date("2026-04-02"),
      },
      {
        po_number: "PO-2026-003",
        status: "PENDING",
        created_at: new Date("2026-04-02"),
        updated_at: new Date("2026-04-02"),
      },
      {
        po_number: "PO-2026-004",
        status: "DONE",
        created_at: new Date("2026-04-01"),
        updated_at: new Date("2026-04-01"),
      },
      {
        po_number: "PO-2026-005",
        status: "PENDING",
        created_at: new Date("2026-04-02"),
        updated_at: new Date("2026-04-02"),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("inbounds", null, {});
  },
};
