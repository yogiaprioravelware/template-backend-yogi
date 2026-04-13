const Item = require("../models/Item");
const { reconcileItemStock } = require("../utils/reconciliation");
const sequelize = require("../utils/database");
const logger = require("../utils/logger");

async function fixAllStock() {
  logger.info("Starting global stock reconciliation script...");
  const items = await Item.findAll();
  
  let fixedCount = 0;
  for (const item of items) {
    try {
      await sequelize.transaction(async (t) => {
        await reconcileItemStock(item.id, t);
      });
      fixedCount++;
    } catch (error) {
      logger.error(`Failed to reconcile item ${item.sku_code}: ${error.message}`);
    }
  }
  
  logger.info(`Reconciliation complete. Processed ${fixedCount} items.`);
  process.exit(0);
}

fixAllStock().catch(err => {
  console.error(err);
  process.exit(1);
});
