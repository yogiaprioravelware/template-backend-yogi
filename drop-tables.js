const sequelize = require("./src/utils/database");
const logger = require("./src/utils/logger");

async function dropAll() {
  try {
    logger.info("Dropping all tables and views...");
    const queryInterface = sequelize.getQueryInterface();
    // Drop view if exists
    await sequelize.query("IF OBJECT_ID('vw_stock_reconciliation', 'V') IS NOT NULL DROP VIEW vw_stock_reconciliation");
    await queryInterface.dropAllTables();
    logger.info("All tables and views dropped successfully.");
    process.exit(0);
  } catch (error) {
    logger.error("Error dropping tables:", error);
    process.exit(1);
  }
}

dropAll();
