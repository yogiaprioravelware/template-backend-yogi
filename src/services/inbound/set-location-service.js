const Item = require("../../models/Item");
const Location = require("../../models/Location");
const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const InboundReceivingLog = require("../../models/InboundReceivingLog");
const InventoryMovement = require("../../models/InventoryMovement");
const ItemLocation = require("../../models/ItemLocation"); // Added as proper import
const { errorResponse } = require("../../utils/response");
const logger = require("../../utils/logger");
const sequelize = require("../../utils/database"); // Added
const { reconcileItemStock } = require("../../utils/reconciliation"); // Added

const setLocation = async (inboundId, inboundItemId, qrString) => {
  logger.info(`Setting location for inbound item ${inboundItemId} in inbound ${inboundId} with QR string: ${qrString}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const location = await Location.findOne({
      where: { qr_string: qrString },
      transaction,
    });

    if (!location) {
      logger.warn(`Set location failed: Location with QR string ${qrString} not found`);
      await transaction.rollback();
      return errorResponse(400, "Location QR code not found");
    }

    if (location.status !== "ACTIVE") {
      logger.warn(`Set location failed: Location ${location.location_code} is inactive`);
      await transaction.rollback();
      return errorResponse(400, "Location is inactive for receiving");
    }

    const inbound = await Inbound.findByPk(inboundId, { transaction });
    if (!inbound) {
      logger.warn(`Set location failed: Inbound with id ${inboundId} not found`);
      await transaction.rollback();
      return errorResponse(400, "Inbound PO not found");
    }

    const inboundItem = await InboundItem.findOne({
      where: {
        id: inboundItemId,
        inbound_id: inboundId,
      },
      transaction,
    });

    if (!inboundItem) {
      logger.warn(`Set location failed: Inbound item with id ${inboundItemId} not found in inbound ${inboundId}`);
      await transaction.rollback();
      return errorResponse(400, "Item not found in this PO");
    }

    if (inboundItem.qty_received >= inboundItem.qty_target) {
      logger.warn(`Set location failed: Quantity for inbound item ${inboundItemId} already completed`);
      await transaction.rollback();
      return errorResponse(400, "Item target quantity already completed");
    }

    inboundItem.qty_received += 1;
    await inboundItem.save({ transaction });
    logger.info(`Inbound item ${inboundItemId} quantity updated to ${inboundItem.qty_received}`);

    await InboundReceivingLog.create({
      inbound_item_id: inboundItem.id,
      location_id: location.id,
      qty_received: 1,
      received_at: new Date(),
    }, { transaction });
    logger.info(`Inbound receiving log created for inbound item ${inboundItemId} at location ${location.id}`);

    const item = await Item.findOne({
      where: { sku_code: inboundItem.sku_code },
      transaction,
    });

    if (item) {
      let itemLoc = await ItemLocation.findOne({
        where: { item_id: item.id, location_id: location.id },
        transaction,
      });

      if (itemLoc) {
        itemLoc.stock += 1;
        await itemLoc.save({ transaction });
      } else {
        itemLoc = await ItemLocation.create({
          item_id: item.id,
          location_id: location.id,
          stock: 1
        }, { transaction });
      }
      logger.info(`Item location stock updated for item ${item.id} at location ${location.id}`);

      await reconcileItemStock(item.id, transaction);
      logger.info(`Item total stock reconciled for SKU ${item.sku_code}`);

      await InventoryMovement.create({
        item_id: item.id,
        location_id: location.id,
        type: "INBOUND",
        qty_change: 1,
        balance_after: itemLoc.stock,
        reference_id: inbound.po_number,
        operator_name: "SYSTEM",
      }, { transaction });
      logger.info(`Inventory Movement logged for INBOUND ${inbound.po_number}`);
    }

    const allInboundItems = await InboundItem.findAll({
      where: { inbound_id: inboundId },
      transaction,
    });

    const allComplete = allInboundItems.every(
      (ii) => ii.qty_received >= ii.qty_target
    );

    // Update inbound status if all complete
    if (allComplete) {
      inbound.status = "DONE";
      await inbound.save({ transaction });
      logger.info(`Inbound ${inboundId} status updated to DONE`);
    } else if (inbound.status === "PENDING") {
      inbound.status = "PROCES";
      await inbound.save({ transaction });
      logger.info(`Inbound ${inboundId} status updated to PROCES`);
    }

    await transaction.commit(); // COMMIT ALL CHANGES
    logger.info(`Transaction committed successfully for inbound ${inboundId}`);

    // Re-fetch all items to calculate progress (after commit to be safe, or use transaction)
    const completedCount = allInboundItems.filter(
      (ii) => ii.qty_received >= ii.qty_target
    ).length;

    return {
      success: true,
      statusCode: 200,
      message: "Item received successfully",
      data: {
        location: {
          id: location.id,
          location_code: location.location_code,
          qr_string: location.qr_string,
          warehouse: location.warehouse,
          rack: location.rack,
          bin: location.bin,
          location_name: location.location_name,
        },
        inbound_item: {
          id: inboundItem.id,
          sku_code: inboundItem.sku_code,
          qty_target: inboundItem.qty_target,
          qty_received: inboundItem.qty_received,
          qty_remaining: inboundItem.qty_target - inboundItem.qty_received,
        },
        inbound_progress: {
          po_number: inbound.po_number,
          status: inbound.status,
          total_items: allInboundItems.length,
          completed_items: completedCount,
          progress_percentage: Math.round(
            (completedCount / allInboundItems.length) * 100
          ),
        },
      },
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Error setting location for inbound ${inboundId}: ${error.message}`);
    return errorResponse(
      500,
      "Error setting location",
      { message: error.message },
      error
    );
  }
};

module.exports = { setLocation };