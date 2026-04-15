'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear existing inbounds and inbound_items
    await queryInterface.bulkDelete('inbound_items', null, {});
    await queryInterface.bulkDelete('inbounds', null, {});

    const inbounds = [];
    const statuses = ['PENDING', 'PROCESS', 'DONE']; // Match the constraint ('PENDING', 'PROCESS', 'DONE')

    for (let i = 1; i <= 10; i++) {
      inbounds.push({
        po_number: 'PO-' + faker.string.alphanumeric({ length: 8, casing: 'upper' }),
        status: faker.helpers.arrayElement(statuses),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('inbounds', inbounds);

    // Get the inserted inbounds to get their IDs
    // Dialect aware query
    const dialect = queryInterface.sequelize.options.dialect;
    const query = dialect === 'mssql' 
      ? 'SELECT TOP 10 id FROM inbounds ORDER BY id DESC'
      : 'SELECT id FROM inbounds ORDER BY id DESC LIMIT 10';
      
    const [insertedInbounds] = await queryInterface.sequelize.query(query);
    
    // Reverse to match the order of creation if necessary
    const inboundIds = insertedInbounds.map(ib => ib.id).reverse();

    const inboundItems = [];
    for (let i = 0; i < 10; i++) {
      const qtyTarget = faker.number.int({ min: 50, max: 200 });
      inboundItems.push({
        inbound_id: inboundIds[i],
        sku_code: `SKU-ITEM-${(i + 1).toString().padStart(3, '0')}`,
        qty_target: qtyTarget,
        qty_received: faker.helpers.arrayElement([0, qtyTarget, faker.number.int({ min: 0, max: qtyTarget })]),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return queryInterface.bulkInsert('inbound_items', inboundItems);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('inbound_items', null, {});
    return queryInterface.bulkDelete('inbounds', null, {});
  }
};
