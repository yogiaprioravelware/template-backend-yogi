'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear existing items and dependencies safely
    // Note: outbound_items and inbound_items reference items by sku_code
    await queryInterface.bulkDelete('outbound_items', null, {});
    await queryInterface.bulkDelete('inbound_items', null, {});
    await queryInterface.bulkDelete('item_locations', null, {});
    await queryInterface.bulkDelete('items', null, {});

    const items = [];
    const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Apparel', 'Food'];
    const uoms = ['PCS', 'BOX', 'SET'];

    for (let i = 1; i <= 10; i++) {
      items.push({
        rfid_tag: '30342509181408C' + i.toString().padStart(9, '0'),
        item_name: faker.commerce.productName(),
        sku_code: `SKU-ITEM-${i.toString().padStart(3, '0')}`,
        category: faker.helpers.arrayElement(categories),
        uom: faker.helpers.arrayElement(uoms),
        current_stock: faker.number.int({ min: 10, max: 1000 }),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return queryInterface.bulkInsert('items', items);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('outbound_items', null, {});
    await queryInterface.bulkDelete('inbound_items', null, {});
    await queryInterface.bulkDelete('item_locations', null, {});
    return queryInterface.bulkDelete('items', null, {});
  }
};
