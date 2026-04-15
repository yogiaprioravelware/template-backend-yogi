'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create inbounds table
      await queryInterface.createTable('inbounds', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        po_number: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'PENDING'
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

      // Add constraint for status
      await queryInterface.sequelize.query(`
        ALTER TABLE inbounds 
        ADD CONSTRAINT inbounds_status_check 
        CHECK (status IN ('PENDING', 'PROCESS', 'DONE'))
      `, { transaction });

      // Create inbound_items table
      await queryInterface.createTable('inbound_items', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        inbound_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'inbounds',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        sku_code: {
          type: Sequelize.STRING(255),
          allowNull: false,
          references: {
            model: 'items',
            key: 'sku_code'
          },
          onDelete: 'NO ACTION'
        },
        qty_target: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        qty_received: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
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

      // Add indexes
      await queryInterface.addIndex('inbound_items', ['inbound_id'], { transaction });
      await queryInterface.addIndex('inbound_items', ['sku_code'], { transaction });
      await queryInterface.addIndex('inbounds', ['status'], { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('inbound_items', { transaction });
      await queryInterface.dropTable('inbounds', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
