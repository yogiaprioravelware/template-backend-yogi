"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ambil ID dari items dan locations yang sudah ada karena bersifat dinamis
    const items = await queryInterface.sequelize.query(
      `SELECT id from ${queryInterface.queryGenerator.quoteTable("items")};`
    );
    const locations = await queryInterface.sequelize.query(
      `SELECT id from ${queryInterface.queryGenerator.quoteTable("locations")};`
    );

    const itemRows = items[0];
    const locRows = locations[0];

    if (itemRows.length > 0 && locRows.length > 0) {
      return queryInterface.bulkInsert("item_locations", [
        {
          item_id: itemRows[0].id, // Laptop
          location_id: locRows[0].id, // Loc 1
          stock: 30,
        },
        {
          item_id: itemRows[0].id, // Laptop
          location_id: locRows[1].id, // Loc 2
          stock: 20,
        },
        {
          item_id: itemRows[1].id, // Mouse
          location_id: locRows[2].id, // Loc 3
          stock: 150,
        },
        {
          item_id: itemRows[2].id, // Keyboard
          location_id: locRows[0].id, // Loc 1
          stock: 40,
        },
        {
          item_id: itemRows[2].id, // Keyboard
          location_id: locRows[3].id, // Loc 4
          stock: 40,
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("item_locations", null, {});
  },
};
