'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rfid_tag: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sku_code: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      uom: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'PCS'
      },
      current_stock: {
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('items');
  }
};
