const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const ItemLocation = require("../../models/ItemLocation");
const InventoryMovement = require("../../models/InventoryMovement");
const locationModel = require("../../models/Location");
const { scanRfidSchema } = require("../../validations/outbound-validation");
const logger = require("../../utils/logger");
const sequelize = require("../../utils/database");
const { reconcileItemStock } = require("../../utils/reconciliation");

// Service untuk scan RFID dan update qty delivered (picking)
const scanRfidPicking = async (outboundId, rfidData) => {
  logger.info(`Scanning RFID for picking. Outbound ID: ${outboundId}, RFID: ${rfidData.rfid_tag}`);
  
  const { error } = scanRfidSchema.validate(rfidData);
  if (error) {
    logger.warn(`Validation failed for RFID picking: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { rfid_tag, location_qr } = rfidData;
  const transaction = await sequelize.transaction();

  try {
    // Check outbound ada atau tidak
    const outbound = await Outbound.findByPk(outboundId, { transaction });
    if (!outbound) {
      logger.warn(`Outbound not found for ID: ${outboundId}`);
      const err = new Error("Outbound not found");
      err.status = 400;
      throw err;
    }

    // Check status outbound
    if (outbound.status === "DONE") {
      logger.warn(`Picking failed: Outbound ${outboundId} is already DONE`);
      const err = new Error("Outbound sudah DONE, tidak bisa picking barang lagi");
      err.status = 400;
      throw err;
    }

    // Cari lokasi berdasarkan QR
    const loc = await locationModel.findOne({ 
      where: { qr_string: location_qr },
      transaction 
    });
    if (!loc || loc.status !== "ACTIVE") {
      logger.warn(`Picking failed: Location with QR ${location_qr} not found or inactive`);
      const err = new Error("Lokasi tidak ditemukan atau tidak aktif");
      err.status = 400;
      throw err;
    }

    // Cari item berdasarkan RFID tag
    const scannedItem = await Item.findOne({ 
      where: { rfid_tag }, 
      transaction 
    });
    if (!scannedItem) {
      logger.warn(`RFID tag not found in system: ${rfid_tag}`);
      const err = new Error("RFID tag tidak ditemukan di sistem");
      err.status = 400;
      throw err;
    }

    // Cari detail item di outbound_items berdasarkan sku_code
    const outboundItem = await OutboundItem.findOne({
      where: {
        outbound_id: outboundId,
        sku_code: scannedItem.sku_code,
      },
      transaction
    });

    if (!outboundItem) {
      logger.warn(`SKU ${scannedItem.sku_code} not found in outbound order ${outboundId}`);
      const err = new Error(`SKU ${scannedItem.sku_code} tidak ada di order ini`);
      err.status = 400;
      throw err;
    }

    // Check apakah sudah penuh
    if (outboundItem.qty_delivered >= outboundItem.qty_target) {
      logger.warn(`Target quantity for SKU ${scannedItem.sku_code} already met in outbound ${outboundId}`);
      const err = new Error(`SKU ${scannedItem.sku_code} sudah mencapai target (${outboundItem.qty_target})`);
      err.status = 400;
      throw err;
    }

    // Cari letak location spesifik tempat item ini dikurangi
    const itemLoc = await ItemLocation.findOne({
      where: { item_id: scannedItem.id, location_id: loc.id },
      transaction
    });

    if (!itemLoc || itemLoc.stock <= 0) {
      logger.warn(`Item ${scannedItem.sku_code} stock is empty in location ${loc.location_code}`);
      const err = new Error(`Stok di lokasi ${loc.location_code} kosong atau tidak ada untuk barang ini`);
      err.status = 400;
      throw err;
    }

    // 1. Update qty_delivered di outbound_items
    outboundItem.qty_delivered += 1;
    await outboundItem.save({ transaction });

    // 2. Update physical location stock
    itemLoc.stock -= 1;
    const balanceAfterLoc = itemLoc.stock;
    
    if (itemLoc.stock === 0) {
      await itemLoc.destroy({ transaction });
    } else {
      await itemLoc.save({ transaction });
    }

    // 3. SELF-HEALING: Recalculate global current_stock from all locations
    await reconcileItemStock(scannedItem.id, transaction);

    // 4. Log movement to Inventory Movement ledger
    await InventoryMovement.create({
      item_id: scannedItem.id,
      location_id: loc.id,
      type: "OUTBOUND",
      qty_change: -1,
      balance_after: balanceAfterLoc,
      reference_id: outbound.order_number,
      operator_name: "SYSTEM",
    }, { transaction });

    // Check semua outbound items sudah complete atau belum
    const allOutboundItems = await OutboundItem.findAll({
      where: { outbound_id: outboundId },
      transaction
    });

    const allComplete = allOutboundItems.every((item) => item.qty_delivered >= item.qty_target);

    // Update status outbound jika semua complete
    if (allComplete) {
      outbound.status = "DONE";
      await outbound.save({ transaction });
    } else if (outbound.status === "PENDING") {
      outbound.status = "PROCES";
      await outbound.save({ transaction });
    }

    await transaction.commit();
    logger.info(`Picking successful for RFID ${rfid_tag}. Transaction committed.`);

    return {
      message: "Barang berhasil dipicking",
      scanned_item: {
        rfid_tag: scannedItem.rfid_tag,
        item_name: scannedItem.item_name,
        sku_code: scannedItem.sku_code,
      },
      outbound_item_status: {
        sku_code: outboundItem.sku_code,
        qty_delivered: outboundItem.qty_delivered,
        qty_target: outboundItem.qty_target,
      },
      outbound_status: outbound.status,
      outbound_type: outbound.outbound_type,
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Picking failed: ${err.message}`);
    throw err;
  }
};

module.exports = scanRfidPicking;