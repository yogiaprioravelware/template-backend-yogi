const sequelize = require("../../utils/database");
const logger = require("../../utils/logger");

/**
 * Service to fetch stock reconciliation report from the database view.
 * This report compares system stock vs the last physical audit results.
 */
const getReconciliationReport = async () => {
  logger.info("Fetching Stock Reconciliation Report from database view");

  try {
    // We query the view using raw query for maximum performance and direct access
    // to the aggregated fields.
    const results = await sequelize.query(
      `SELECT 
        item_id, sku_code, item_name, 
        location_id, location_code, warehouse, rack, bin, 
        system_stock, last_physical_qty, last_variance, 
        last_audit_date, last_operator 
      FROM vw_stock_reconciliation`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    logger.info(`Found ${results.length} reconciliation records`);
    return results;
  } catch (error) {
    logger.error(`Error fetching reconciliation report: ${error.message}`);
    throw error;
  }
};

module.exports = getReconciliationReport;
