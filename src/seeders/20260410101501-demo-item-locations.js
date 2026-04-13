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
          location_id: locRows[1].id, // LOC-001
          stock: 30,
        },
        {
          item_id: itemRows[0].id, 
          location_id: locRows[2].id, // LOC-002
          stock: 20,
        },
        {
          item_id: itemRows[1].id, 
          location_id: locRows[2].id, // LOC-002
          stock: 150,
        },
        {
          item_id: itemRows[2].id, 
          location_id: locRows[3].id, // LOC-003
          stock: 40,
        },
        {
          item_id: itemRows[2].id, 
          location_id: locRows[4].id, // LOC-004
          stock: 40,
        },
        // items in receiving
        {
          item_id: itemRows[3].id, 
          location_id: locRows[0].id, // RECEIVING-01
          stock: 30,
        },
        {
          item_id: itemRows[4].id, 
          location_id: locRows[0].id, // RECEIVING-01
          stock: 200,
        },
        {
          item_id: itemRows[5].id, 
          location_id: locRows[0].id, // RECEIVING-01
          stock: 25,
        },
        {
          item_id: itemRows[6].id, 
          location_id: locRows[0].id, // RECEIVING-01
          stock: 120,
        },
        {
          item_id: itemRows[7].id, 
          location_id: locRows[0].id, // RECEIVING-01
          stock: 60,
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("item_locations", null, {});
  },
};
