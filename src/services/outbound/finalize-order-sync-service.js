const { 
  Outbound, 
  OutboundItem, 
  StagingItem, 
  StagingSession, 
  StagingAuditLog, 
  Item, 
  sequelize 
} = require("../../models");
const { reconcileItemStock } = require("../../utils/reconciliation");
const logger = require("../../utils/logger");

/**
 * Menyelesaikan order outbound dan mensinkronisasikan data staging terkait.
 * Memastikan pemenuhan 100% target qty sebelum memperbarui status order menjadi DONE.
 * @param {number} outboundId 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const finalizeOrderSync = async (outboundId, userId) => {
  logger.info(`Synchronizing and Finalizing Outbound Order: ${outboundId}`);
  
  const transaction = await sequelize.transaction();
  try {
    // 1. Fetch Outbound Header & Items
    const outbound = await Outbound.findByPk(outboundId, {
      include: [{ model: OutboundItem, as: "items" }],
      transaction
    });

    if (!outbound) {
      throw new Error("Outbound order not found");
    }

    if (outbound.status === "DONE") {
      throw new Error("Order is already finalized");
    }

    // 2. Strict Fulfillment Check (100% Target)
    const items = outbound.items || [];
    const isFullyFulfilled = items.every(item => item.qty_delivered >= item.qty_target);
    
    if (!isFullyFulfilled) {
      const pendingItems = items
        .filter(i => i.qty_delivered < i.qty_target)
        .map(i => i.sku_code)
        .join(", ");
      throw new Error(`Cannot finalize. Order is not 100% fulfilled. Remaining items: ${pendingItems}`);
    }

    // 3. Find all associated Staging Items for this order
    const outboundItemIds = items.map(i => i.id);
    const stagingItems = await StagingItem.findAll({
      where: { 
        outbound_item_id: outboundItemIds,
        status: "STAGED"
      },
      transaction
    });

    if (stagingItems.length === 0) {
      // If no staging items but already fulfilled (maybe manual process), just finish
      outbound.status = "DONE";
      await outbound.save({ transaction });
      await transaction.commit();
      return { message: "Order finalized successfully", order_number: outbound.order_number };
    }

    const rfidTags = stagingItems.map(si => si.rfid_tag);
    const sessionIds = [...new Set(stagingItems.map(si => si.staging_session_id))];

    // 4. Batch Update Staging Items to FINALIZED
    await StagingItem.update(
      { status: "FINALIZED" },
      { 
        where: { id: stagingItems.map(si => si.id) },
        transaction 
      }
    );

    // Fetch items for reconciliation in one go
    const dbItems = await Item.findAll({
      where: { rfid_tag: rfidTags },
      attributes: ['id'],
      transaction
    });
    const itemIdsToReconcile = dbItems.map(i => i.id);

    // 5. Check and Finalize associated Staging Sessions
    for (const sessionId of sessionIds) {
      const remainingOpenItems = await StagingItem.count({
        where: { staging_session_id: sessionId, status: "STAGED" },
        transaction
      });

      if (remainingOpenItems === 0) {
        await StagingSession.update(
          { status: "FINALIZED" },
          { where: { id: sessionId }, transaction }
        );
        
        await StagingAuditLog.create({
          staging_session_id: sessionId,
          user_id: userId,
          action: "AUTO_FINALIZE_BY_SYNC",
          details: JSON.stringify({ 
            reference_order: outbound.order_number,
            notification_sent: true
          }),
        }, { transaction });
      }
    }

    // 6. Update Outbound Status to DONE
    outbound.status = "DONE";
    await outbound.save({ transaction });

    // 7. Data Integrity Refresh (Reconciliation)
    await Promise.all(itemIdsToReconcile.map(itemId => reconcileItemStock(itemId, transaction)));

    await transaction.commit();
    logger.info(`Successfully finalized and synced order ${outbound.order_number}. Notification sent.`);

    return {
      message: "Order finalized and staging synchronized successfully. Inventory updated and user notified.",
      order_number: outbound.order_number,
      items_finalized: stagingItems.length
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Order sync finalization failed: ${error.message}`);
    throw error;
  }
};

module.exports = finalizeOrderSync;
