"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
          item_id: itemRows[0].id, 
          location_id: locRows[0].id, 
          stock: 30,
        },
        {
          item_id: itemRows[0].id, 
          location_id: locRows[1].id, 
          stock: 20,
        },
        {
          item_id: itemRows[1].id, 
          location_id: locRows[2].id, 
          stock: 150,
        },
        {
          item_id: itemRows[2].id, 
          location_id: locRows[0].id, 
          stock: 40,
        },
        {
          item_id: itemRows[2].id, 
          location_id: locRows[3].id, 
          stock: 40,
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("item_locations", null, {});
  },
};
