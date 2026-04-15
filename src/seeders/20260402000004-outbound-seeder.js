'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear existing outbounds and outbound_items
    await queryInterface.bulkDelete('outbound_items', null, {});
    await queryInterface.bulkDelete('outbounds', null, {});

    const outbounds = [];
    const types = ['LUNAS', 'PINJAM', 'RETURN'];
    const statuses = ['PENDING', 'PROCESS', 'DONE']; // Match the constraint ('PENDING', 'PROCESS', 'DONE')

    for (let i = 1; i <= 10; i++) {
      outbounds.push({
        order_number: 'SO-' + faker.string.alphanumeric({ length: 8, casing: 'upper' }),
        outbound_type: faker.helpers.arrayElement(types),
        status: faker.helpers.arrayElement(statuses),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('outbounds', outbounds);

    // Get the inserted outbounds to get their IDs
    // Dialect aware query
    const dialect = queryInterface.sequelize.options.dialect;
    const query = dialect === 'mssql' 
      ? 'SELECT TOP 10 id FROM outbounds ORDER BY id DESC'
      : 'SELECT id FROM outbounds ORDER BY id DESC LIMIT 10';

    const [insertedOutbounds] = await queryInterface.sequelize.query(query);
    
    // Reverse to match the order of creation if necessary
    const outboundIds = insertedOutbounds.map(ob => ob.id).reverse();

    const outboundItems = [];
    for (let i = 0; i < 10; i++) {
      const qtyTarget = faker.number.int({ min: 10, max: 50 });
      outboundItems.push({
        outbound_id: outboundIds[i],
        sku_code: `SKU-ITEM-${(i + 1).toString().padStart(3, '0')}`,
        qty_target: qtyTarget,
        qty_delivered: faker.helpers.arrayElement([0, qtyTarget, faker.number.int({ min: 0, max: qtyTarget })]),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return queryInterface.bulkInsert('outbound_items', outboundItems);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('outbound_items', null, {});
    return queryInterface.bulkDelete('outbounds', null, {});
  }
};
