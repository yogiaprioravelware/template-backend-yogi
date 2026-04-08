'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create locations table
      await queryInterface.createTable('locations', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        location_code: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        qr_string: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        warehouse: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        rack: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        bin: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        location_name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'ACTIVE'
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create inbound_receiving_log table
      await queryInterface.createTable('inbound_receiving_log', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        inbound_item_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'inbound_items',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        location_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'locations',
            key: 'id'
          },
          onDelete: 'NO ACTION'
        },
        qty_received: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        received_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('locations', ['status'], { transaction });
      await queryInterface.addIndex('locations', ['qr_string'], { transaction });
      await queryInterface.addIndex('inbound_receiving_log', ['inbound_item_id'], { transaction });
      await queryInterface.addIndex('inbound_receiving_log', ['location_id'], { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('inbound_receiving_log', { transaction });
      await queryInterface.dropTable('locations', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
