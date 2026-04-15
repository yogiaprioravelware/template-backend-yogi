'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear existing locations and dependencies safely
    await queryInterface.bulkDelete('item_locations', null, {});
    await queryInterface.bulkDelete('locations', null, {});

    const locations = [
      {
        location_code: 'WH1-A1-R1-B1',
        qr_string: 'QR-WH1-A1-R1-B1',
        warehouse: 'Main Warehouse',
        rack: 'Rack A1',
        bin: 'Bin 1',
        location_name: 'Main Warehouse - Area A1 - Rack 1 - Bin 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH1-A1-R1-B2',
        qr_string: 'QR-WH1-A1-R1-B2',
        warehouse: 'Main Warehouse',
        rack: 'Rack A1',
        bin: 'Bin 2',
        location_name: 'Main Warehouse - Area A1 - Rack 1 - Bin 2',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH1-A1-R2-B1',
        qr_string: 'QR-WH1-A1-R2-B1',
        warehouse: 'Main Warehouse',
        rack: 'Rack A2',
        bin: 'Bin 1',
        location_name: 'Main Warehouse - Area A1 - Rack 2 - Bin 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH1-A2-R1-B1',
        qr_string: 'QR-WH1-A2-R1-B1',
        warehouse: 'Main Warehouse',
        rack: 'Rack B1',
        bin: 'Bin 1',
        location_name: 'Main Warehouse - Area A2 - Rack 1 - Bin 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH2-B1-R1-B1',
        qr_string: 'QR-WH2-B1-R1-B1',
        warehouse: 'Cold Storage',
        rack: 'Rack C1',
        bin: 'Bin 1',
        location_name: 'Cold Storage - Area B1 - Rack 1 - Bin 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH2-B1-R1-B2',
        qr_string: 'QR-WH2-B1-R1-B2',
        warehouse: 'Cold Storage',
        rack: 'Rack C1',
        bin: 'Bin 2',
        location_name: 'Cold Storage - Area B1 - Rack 1 - Bin 2',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH3-C1-R1-B1',
        qr_string: 'QR-WH3-C1-R1-B1',
        warehouse: 'Distribution Center',
        rack: 'Rack D1',
        bin: 'Bin 1',
        location_name: 'Distribution Center - Area C1 - Rack 1 - Bin 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH3-C1-R1-B2',
        qr_string: 'QR-WH3-C1-R1-B2',
        warehouse: 'Distribution Center',
        rack: 'Rack D1',
        bin: 'Bin 2',
        location_name: 'Distribution Center - Area C1 - Rack 1 - Bin 2',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'WH3-C2-R1-B1',
        qr_string: 'QR-WH3-C2-R1-B1',
        warehouse: 'Distribution Center',
        rack: 'Rack E1',
        bin: 'Bin 1',
        location_name: 'Distribution Center - Area C2 - Rack 1 - Bin 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        location_code: 'STAGING-01',
        qr_string: 'QR-STAGING-01',
        warehouse: 'Main Warehouse',
        rack: 'Staging',
        bin: 'Area 1',
        location_name: 'Main Warehouse - Staging Area 1',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    return queryInterface.bulkInsert('locations', locations);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('item_locations', null, {});
    return queryInterface.bulkDelete('locations', null, {});
  }
};
