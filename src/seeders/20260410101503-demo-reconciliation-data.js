"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Ambil ID dinamis dari items dan locations
      const [items] = await queryInterface.sequelize.query(
        `SELECT id, sku_code from ${queryInterface.queryGenerator.quoteTable("items")};`
      );
      const [locations] = await queryInterface.sequelize.query(
        `SELECT id from ${queryInterface.queryGenerator.quoteTable("locations")};`
      );

      if (items.length > 0 && locations.length > 0) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Pastikan kita mengakses ID dengan benar (beberapa dialect case-sensitive)
        const getItemId = (item) => item.id || item.ID;
        const getLocationId = (loc) => loc.id || loc.ID;

        return queryInterface.bulkInsert("inventory_movements", [
          // Laptop di Loc 1 - Match (Accurate)
          {
            item_id: getItemId(items[0]),
            location_id: getLocationId(locations[0]),
            type: "STOCK_OPNAME",
            qty_change: 0,
            balance_after: 30, 
            reference_id: "AUDIT-001",
            operator_name: "admin",
            created_at: oneHourAgo,
            updated_at: oneHourAgo,
          },
          // Laptop di Loc 2 - Deficit
          {
            item_id: getItemId(items[0]),
            location_id: getLocationId(locations[1]),
            type: "STOCK_OPNAME",
            qty_change: -2,
            balance_after: 18, 
            reference_id: "AUDIT-002",
            operator_name: "alpha_operator",
            created_at: now,
            updated_at: now,
          },
          // Keyboard di Loc 1 - Surplus
          {
            item_id: getItemId(items[2]),
            location_id: getLocationId(locations[0]),
            type: "STOCK_OPNAME",
            qty_change: 5,
            balance_after: 45, 
            reference_id: "AUDIT-003",
            operator_name: "admin",
            created_at: now,
            updated_at: now,
          },
        ]);
      }
    } catch (error) {
      console.error('Seeder Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Gunakan Op jika tersedia, atau string mentah
    const Op = Sequelize.Op || (Sequelize.Sequelize && Sequelize.Sequelize.Op);
    const filter = Op 
      ? { reference_id: { [Op.like]: "AUDIT-%" } }
      : { reference_id: "AUDIT-001" }; // Fallback minimal

    return queryInterface.bulkDelete("inventory_movements", filter);
  },
};

