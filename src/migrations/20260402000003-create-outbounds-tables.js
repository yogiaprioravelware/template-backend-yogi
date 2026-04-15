'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create outbounds table
      await queryInterface.createTable('outbounds', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        order_number: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        outbound_type: {
          type: Sequelize.STRING(50),
          allowNull: false
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
        ALTER TABLE outbounds 
        ADD CONSTRAINT outbounds_status_check 
        CHECK (status IN ('PENDING', 'PROCESS', 'DONE'))
      `, { transaction });

      // Add constraint for outbound_type
      await queryInterface.sequelize.query(`
        ALTER TABLE outbounds 
        ADD CONSTRAINT outbounds_type_check 
        CHECK (outbound_type IN ('LUNAS', 'PINJAM', 'RETURN'))
      `, { transaction });

      // Create outbound_items table
      await queryInterface.createTable('outbound_items', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        outbound_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'outbounds',
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
        qty_delivered: {
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
      await queryInterface.addIndex('outbound_items', ['outbound_id'], { transaction });
      await queryInterface.addIndex('outbound_items', ['sku_code'], { transaction });
      await queryInterface.addIndex('outbounds', ['status'], { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('outbound_items', { transaction });
      await queryInterface.dropTable('outbounds', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
