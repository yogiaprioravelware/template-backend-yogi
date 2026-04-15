const { 
  StagingSession, 
  StagingItem, 
  StagingAuditLog, 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  InventoryMovement, 
  Location,
  sequelize,
  Op 
} = require("../../models");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation");

/**
 * Menambahkan item ke sesi staging melalui proses scanning RFID dan verifikasi lokasi.
 * Melibatkan validasi sesi, lokasi, ketersediaan stok, dan pencarian order outbound yang cocok (FIFO).
 * @param {number} sessionId 
 * @param {Object} scanData 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const addStagingItem = async (sessionId, scanData, userId) => {
  const { rfid_tag, location_qr } = scanData;
  logger.info(`Adding item to staging session ${sessionId}: RFID ${rfid_tag} from Location ${location_qr}`);

  const transaction = await sequelize.transaction();
  try {
    // 1. Check Session
    const session = await StagingSession.findByPk(sessionId, { transaction });
    if (!session || session.status !== "OPEN") {
      const err = new Error("Staging session not found or not in OPEN status");
      err.status = 400;
      throw err;
    }

    // 2. Validate Location
    const loc = await Location.findOne({ 
      where: { qr_string: location_qr, status: "ACTIVE" },
      transaction 
    });
    if (!loc) {
      const err = new Error("Invalid or inactive source location");
      err.status = 400;
      throw err;
    }

    // 3. Validate RFID in Item Master
    const item = await Item.findOne({ where: { rfid_tag }, transaction });
    if (!item) {
      const err = new Error("RFID tag not found in system");
      err.status = 400;
      throw err;
    }

    // 4. Check if already staged in any active session
    const existingStaging = await StagingItem.findOne({
      where: { rfid_tag, status: "STAGED" },
      transaction
    });
    if (existingStaging) {
      const err = new Error("Item is already in a staging area");
      err.status = 400;
      throw err;
    }

    // 5. Check Stock at Source
    const itemLoc = await ItemLocation.findOne({
      where: { item_id: item.id, location_id: loc.id },
      transaction
    });
    if (!itemLoc || itemLoc.stock <= 0) {
      const err = new Error(`Item ${item.sku_code} stock is empty in location ${loc.location_code}`);
      err.status = 400;
      throw err;
    }

    // 6. Find Oldest Matching Outbound Order (FIFO)
    const outboundItem = await OutboundItem.findOne({
      where: {
        sku_code: item.sku_code,
        qty_staged: { [Op.lt]: sequelize.col("qty_target") }
      },
      order: [['id', 'ASC']],
      transaction
    });

    if (!outboundItem) {
      const err = new Error(`No pending outbound orders found for SKU ${item.sku_code}`);
      err.status = 400;
      throw err;
    }

    const outboundHeader = await Outbound.findByPk(outboundItem.outbound_id, { transaction });
    if (!outboundHeader || outboundHeader.status === "DONE") {
      const err = new Error("Associated outbound order is already DONE or not found");
      err.status = 400;
      throw err;
    }

    // 7. Update Inventory (Physical removal from rack)
    itemLoc.stock -= 1;
    const balanceAfter = itemLoc.stock;
    if (itemLoc.stock === 0) {
      await itemLoc.destroy({ transaction });
    } else {
      await itemLoc.save({ transaction });
    }
    await reconcileItemStock(item.id, transaction);

    // Create Inventory Movement
    await InventoryMovement.create({
      item_id: item.id,
      location_id: loc.id,
      type: "OUTBOUND",
      qty_change: -1,
      balance_after: balanceAfter,
      reference_id: outboundHeader.order_number,
      operator_name: `STAGING_PICKER_${userId}`,
    }, { transaction });

    // 8. Update OutboundItem staged quantity
    outboundItem.qty_staged += 1;
    await outboundItem.save({ transaction });

    // 9. Create StagingItem record
    const stagingItem = await StagingItem.create({
      staging_session_id: sessionId,
      rfid_tag: item.rfid_tag,
      outbound_item_id: outboundItem.id,
      location_id: loc.id,
      status: "STAGED",
    }, { transaction });

    // 10. Audit Log
    await StagingAuditLog.create({
      staging_session_id: sessionId,
      user_id: userId,
      action: "ADD_ITEM",
      details: { 
        rfid_tag: item.rfid_tag, 
        sku_code: item.sku_code,
        source_location: loc.location_code,
        order_number: outboundHeader.order_number
      },
    }, { transaction });

    await transaction.commit();
    return {
      staging_item: stagingItem,
      item_details: {
        item_name: item.item_name,
        sku_code: item.sku_code,
      },
      order_info: {
        order_number: outboundHeader.order_number,
        qty_staged: outboundItem.qty_staged,
        qty_target: outboundItem.qty_target
      }
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Failed to add item to staging: ${err.message}`);
    throw err;
  }
};

module.exports = addStagingItem;
