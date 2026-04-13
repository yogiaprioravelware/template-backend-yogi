module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("locations", [
      {
        location_code: "RECEIVING-01",
        qr_string: "QR-RECEIVING-DOCK-01",
        warehouse: "Main Warehouse",
        rack: "Receiving",
        bin: "Dock 1",
        location_name: "Area Penerimaan (Receiving Area)",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        location_code: "LOC-001",
        qr_string: "QR-GDG-A-RAK-1-BIN-1",
        warehouse: "Gudang A",
        rack: "Rak 1",
        bin: "Bin 1",
        location_name: "Gudang A - Rak 1 - Bin 1",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        location_code: "LOC-002",
        qr_string: "QR-GDG-A-RAK-1-BIN-2",
        warehouse: "Gudang A",
        rack: "Rak 1",
        bin: "Bin 2",
        location_name: "Gudang A - Rak 1 - Bin 2",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        location_code: "LOC-003",
        qr_string: "QR-GDG-A-RAK-2-BIN-1",
        warehouse: "Gudang A",
        rack: "Rak 2",
        bin: "Bin 1",
        location_name: "Gudang A - Rak 2 - Bin 1",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        location_code: "LOC-004",
        qr_string: "QR-GDG-B-RAK-1-BIN-1",
        warehouse: "Gudang B",
        rack: "Rak 1",
        bin: "Bin 1",
        location_name: "Gudang B - Rak 1 - Bin 1",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("locations", null, {});
  },
};
