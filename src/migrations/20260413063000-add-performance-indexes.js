'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('items', ['rfid_tag'], { name: 'items_rfid_tag_idx' });
    await queryInterface.addIndex('items', ['sku_code'], { name: 'items_sku_code_idx' });
    await queryInterface.addIndex('locations', ['qr_string'], { name: 'locations_qr_string_idx' });
    await queryInterface.addIndex('locations', ['location_code'], { name: 'locations_location_code_idx' });
    await queryInterface.addIndex('inventory_movements', ['reference_id'], { name: 'inventory_movements_reference_id_idx' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('items', 'items_rfid_tag_idx');
    await queryInterface.removeIndex('items', 'items_sku_code_idx');
    await queryInterface.removeIndex('locations', 'locations_qr_string_idx');
    await queryInterface.removeIndex('locations', 'locations_location_code_idx');
    await queryInterface.removeIndex('inventory_movements', 'inventory_movements_reference_id_idx');
  }
};
