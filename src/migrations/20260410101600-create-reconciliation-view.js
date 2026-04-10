'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE VIEW vw_stock_reconciliation AS
      SELECT 
          i.id AS item_id,
          i.sku_code,
          i.item_name,
          l.id AS location_id,
          l.location_code,
          l.warehouse,
          l.rack,
          l.bin,
          il.stock AS system_stock,
          m.balance_after AS last_physical_qty,
          m.qty_change AS last_variance,
          m.created_at AS last_audit_date,
          m.operator_name AS last_operator
      FROM items i
      JOIN item_locations il ON i.id = il.item_id
      JOIN locations l ON il.location_id = l.id
      LEFT JOIN (
          SELECT 
              item_id, 
              location_id, 
              balance_after, 
              qty_change, 
              created_at, 
              operator_name,
              ROW_NUMBER() OVER (PARTITION BY item_id, location_id ORDER BY created_at DESC) as rn
          FROM inventory_movements
          WHERE type = 'STOCK_OPNAME'
      ) m ON i.id = m.item_id AND l.id = m.location_id AND m.rn = 1;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS vw_stock_reconciliation');
  }
};
