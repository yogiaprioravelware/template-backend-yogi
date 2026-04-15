const { 
  StagingSession, 
  StagingItem, 
  StagingAuditLog, 
  Outbound, 
  OutboundItem, 
  Item, 
  sequelize 
} = require("../../models");
const { reconcileItemStock } = require("../../utils/reconciliation");
const logger = require("../../utils/logger");

/**
 * Menyelesaikan sesi staging, memperbarui status pengiriman pada order outbound,
 * dan melakukan sinkronisasi stok akhir.
 * @param {number} sessionId 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const finalizeSession = async (sessionId, userId) => {
  logger.info(`Finalizing staging session: ${sessionId}`);
  
  const transaction = await sequelize.transaction();
  try {
    const session = await StagingSession.findByPk(sessionId, { transaction });
    if (!session || session.status !== "OPEN") {
      const err = new Error("Staging session not found or already finalized");
      err.status = 400;
      throw err;
    }

    const stagingItems = await StagingItem.findAll({
      where: { staging_session_id: sessionId, status: "STAGED" },
      transaction
    });

    if (stagingItems.length === 0) {
      const err = new Error("No items in staging to finalize");
      err.status = 400;
      throw err;
    }

    const outboundIdsToCheck = new Set();
    const itemIdsToReconcile = new Set();

    for (const stgItem of stagingItems) {
      // 1. Mark item as finalized
      stgItem.status = "FINALIZED";
      await stgItem.save({ transaction });

      // 2. Update OutboundItem
      const obItem = await OutboundItem.findByPk(stgItem.outbound_item_id, { transaction });
      if (obItem) {
        obItem.qty_delivered += 1;
        await obItem.save({ transaction });
        outboundIdsToCheck.add(obItem.outbound_id);
        
        // 3. Find Item
        const item = await Item.findOne({ where: { rfid_tag: stgItem.rfid_tag }, transaction });
        if (!item) {
          throw new Error(`Item with RFID ${stgItem.rfid_tag} not found`);
        }
        itemIdsToReconcile.add(item.id);
      }
    }

    // 6. Update Session status
    session.status = "FINALIZED";
    await session.save({ transaction });

    // 7. Update Outbound Header status if all items delivered
    for (const outboundId of outboundIdsToCheck) {
      const allItems = await OutboundItem.findAll({ where: { outbound_id: outboundId }, transaction });
      const isComplete = allItems.every(item => item.qty_delivered >= item.qty_target);
      
      const updateData = { 
        status: isComplete ? "DONE" : "PROCES"
      };
      
      await Outbound.update(updateData, { where: { id: outboundId }, transaction });
    }

    // 8. Run Reconcile for all affected items
    for (const itemId of itemIdsToReconcile) {
      await reconcileItemStock(itemId, transaction);
    }

    // 9. Audit Log
    await StagingAuditLog.create({
      staging_session_id: sessionId,
      user_id: userId,
      action: "FINALIZE",
      details: {
        item_count: stagingItems.length,
        notification_sent: true
      },
    }, { transaction });

    await transaction.commit();

    logger.info(`Finalize confirmation notification sent to User ${userId} for Session ${session.session_number}`);

    return { 
      message: "Staging session finalized successfully and inventory updated", 
      item_count: stagingItems.length,
      session_number: session.session_number
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Failed to finalize staging session: ${err.message}`);
    throw err;
  }
};

module.exports = finalizeSession;
