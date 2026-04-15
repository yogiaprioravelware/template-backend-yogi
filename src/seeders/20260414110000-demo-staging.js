"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Ambil data pendukung
    const isMssql = queryInterface.sequelize.options.dialect === 'mssql';
    const usersQuery = isMssql ? "SELECT TOP 1 id FROM users;" : "SELECT id FROM users LIMIT 1;";
    const [users] = await queryInterface.sequelize.query(usersQuery);
    const adminId = users[0]?.id || 1;

    const locQuery = isMssql ? "SELECT TOP 2 id FROM locations;" : "SELECT id FROM locations LIMIT 2;";
    const [locations] = await queryInterface.sequelize.query(locQuery);
    const loc1 = locations[0]?.id || 1;
    const loc2 = locations[1]?.id || 2;

    const outQuery = isMssql ? "SELECT TOP 5 id FROM outbound_items;" : "SELECT id FROM outbound_items LIMIT 5;";
    const [outboundItems] = await queryInterface.sequelize.query(outQuery);
    
    // 2. Buat Sesi Staging dengan berbagai status
    const sessions = await queryInterface.bulkInsert(
      "staging_sessions",
      [
        {
          session_number: "STG-OPEN-001",
          status: "OPEN",
          created_by_id: adminId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          session_number: "STG-FINAL-002",
          status: "FINALIZED",
          created_by_id: adminId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          session_number: "STG-EDGE-003",
          status: "OPEN",
          created_by_id: adminId,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ],
      { returning: ["id"] }
    );

    // Karena bulkInsert di MSSQL/Postgres mungkin mengembalikan format berbeda, kita coba handle
    const sessionIds = sessions.map(s => s.id);

    // 3. Tambahkan Items ke Staging
    if (outboundItems.length > 0) {
      await queryInterface.bulkInsert("staging_items", [
        // Skenario Normal di Sesi 1
        {
          staging_session_id: sessionIds[0],
          outbound_item_id: outboundItems[0].id,
          rfid_tag: "E20000190605012345678901",
          location_id: loc1,
          status: "STAGED",
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Skenario Finalized di Sesi 2
        {
          staging_session_id: sessionIds[1],
          outbound_item_id: outboundItems[1].id,
          rfid_tag: "E20000190605012345678902",
          location_id: loc2,
          status: "FINALIZED",
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Skenario Multiple Items di Sesi 3 (Edge Case: Satu lokasi, beda RFID)
        {
          staging_session_id: sessionIds[2],
          outbound_item_id: outboundItems[2].id,
          rfid_tag: "E20000190605012345678903",
          location_id: loc1,
          status: "STAGED",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          staging_session_id: sessionIds[2],
          outbound_item_id: outboundItems[3].id,
          rfid_tag: "E20000190605012345678904",
          location_id: loc1,
          status: "STAGED",
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);
    }

    // 4. Audit Logs
    await queryInterface.bulkInsert("staging_audit_logs", [
      {
        staging_session_id: sessionIds[0],
        user_id: adminId,
        action: "CREATE",
        details: JSON.stringify({ session_number: "STG-OPEN-001" }),
        created_at: new Date(),
      },
      {
        staging_session_id: sessionIds[0],
        user_id: adminId,
        action: "ADD_ITEM",
        details: JSON.stringify({ rfid_tag: "E20000190605012345678901", sku: "LAPTOP-001" }),
        created_at: new Date(),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("staging_audit_logs", null, {});
    await queryInterface.bulkDelete("staging_items", null, {});
    await queryInterface.bulkDelete("staging_sessions", null, {});
  },
};
