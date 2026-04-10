"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("inventory_movements", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "items", // refers to table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // If item is deleted, wipe its movements history
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "locations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        // ENUM: INBOUND, OUTBOUND, STOCK_OPNAME, MANUAL_ADJUSTMENT
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      qty_change: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.STRING(100),
        allowNull: true, // Could be PO Number or Outbound Order ID
      },
      operator_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("inventory_movements");
  },
};
