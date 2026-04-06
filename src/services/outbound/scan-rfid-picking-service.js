const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const { scanRfidSchema } = require("../../validations/outbound-validation");
const logger = require("../../utils/logger");

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

  const { rfid_tag } = rfidData;

  // Check outbound ada atau tidak
  const outbound = await Outbound.findByPk(outboundId);
  if (!outbound) {
    logger.warn(`Outbound not found for ID: ${outboundId}`);
    const err = new Error("Outbound not found");
    err.status = 404;
    throw err;
  }

  // Check status outbound
  if (outbound.status === "DONE") {
    logger.warn(`Picking failed: Outbound ${outboundId} is already DONE`);
    const err = new Error("Outbound sudah DONE, tidak bisa picking barang lagi");
    err.status = 400;
    throw err;
  }

  // Cari item berdasarkan RFID tag
  const scannedItem = await Item.findOne({ where: { rfid_tag } });
  if (!scannedItem) {
    logger.warn(`RFID tag not found in system: ${rfid_tag}`);
    const err = new Error("RFID tag tidak ditemukan di sistem");
    err.status = 404;
    throw err;
  }
  logger.info(`Found item with SKU: ${scannedItem.sku_code} for RFID tag: ${rfid_tag}`);

  // Cari detail item di outbound_items berdasarkan sku_code
  const outboundItem = await OutboundItem.findOne({
    where: {
      outbound_id: outboundId,
      sku_code: scannedItem.sku_code,
    },
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

  // Update qty_delivered di outbound_items
  outboundItem.qty_delivered += 1;
  await outboundItem.save();
  logger.info(`Updated qty_delivered for SKU ${outboundItem.sku_code} to ${outboundItem.qty_delivered}`);

  // Update current_stock di items (kurangi untuk semua tipe: LUNAS, PINJAM, RETURN)
  scannedItem.current_stock -= 1;
  await scannedItem.save();
  logger.info(`Decremented stock for SKU ${scannedItem.sku_code}. New stock: ${scannedItem.current_stock}`);

  // Check semua outbound items sudah complete atau belum
  const allOutboundItems = await OutboundItem.findAll({
    where: { outbound_id: outboundId },
  });

  const allComplete = allOutboundItems.every((item) => item.qty_delivered >= item.qty_target);

  // Update status outbound jika semua complete
  if (allComplete) {
    outbound.status = "DONE";
    await outbound.save();
    logger.info(`Outbound ${outboundId} status updated to DONE`);
  } else if (outbound.status === "PENDING") {
    outbound.status = "PROCES";
    await outbound.save();
    logger.info(`Outbound ${outboundId} status updated to PROCES`);
  }

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
};

module.exports = scanRfidPicking;