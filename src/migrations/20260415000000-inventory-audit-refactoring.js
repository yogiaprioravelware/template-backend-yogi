'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 2. Drop location_transfers
    await queryInterface.dropTable('location_transfers', { cascade: true }).catch(() => {});

    // 3. Drop location_id from items
    try {
      const itemsDesc = await queryInterface.describeTable('items');
      if (itemsDesc.location_id) {
        await queryInterface.removeColumn('items', 'location_id');
      }
    } catch(e) {}

    // 4. Create inbound_logs
    await queryInterface.createTable('inbound_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      inbound_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rfid_tag: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      area: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Create outbound_logs
    await queryInterface.createTable('outbound_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      outbound_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rfid_tag: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      staging_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inbound_logs').catch(() => {});
    await queryInterface.dropTable('outbound_logs').catch(() => {});
  }
};
