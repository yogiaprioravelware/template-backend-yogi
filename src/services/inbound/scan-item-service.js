const { Item, Inbound, InboundItem } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Melakukan verifikasi awal scanning item RFID terhadap dokumen inbound.
 * Memastikan item termasuk dalam daftar PO dan belum melebihi target quantity.
 * @param {number} inboundId 
 * @param {string} rfidTag 
 * @returns {Promise<Object>}
 */
const scanItem = async (inboundId, rfidTag) => {
  logger.info(`Scanning item with RFID tag: ${rfidTag} for inbound: ${inboundId}`);
  
  const inbound = await Inbound.findByPk(inboundId);
  if (!inbound) {
    logger.warn(`Scan failed: Inbound with id ${inboundId} not found`);
    const error = new Error("Inbound PO not found");
    error.status = 404;
    throw error;
  }

  if (inbound.status === "DONE") {
    logger.warn(`Scan failed: Inbound ${inboundId} is already completed`);
    const error = new Error("Inbound PO is already completed");
    error.status = 400;
    throw error;
  }

  const item = await Item.findOne({
    where: { rfid_tag: rfidTag },
  });

  if (!item) {
    logger.warn(`Scan failed: Item with RFID tag ${rfidTag} not found`);
    const error = new Error("RFID tag not found in system");
    error.status = 404;
    throw error;
  }

  const inboundItem = await InboundItem.findOne({
    where: {
      inbound_id: inboundId,
      sku_code: item.sku_code,
    },
  });

  if (!inboundItem) {
    logger.warn(`Scan failed: Item with SKU ${item.sku_code} not in PO ${inboundId}`);
    const error = new Error(`SKU ${item.sku_code} is not in this PO`);
    error.status = 400;
    throw error;
  }

  if (inboundItem.qty_received >= inboundItem.qty_target) {
    logger.warn(`Scan failed: Quantity for SKU ${item.sku_code} in PO ${inboundId} already completed`);
    const error = new Error("Item target quantity already completed");
    error.status = 400;
    throw error;
  }

  // Return pending location response
  logger.info(`Item ${item.sku_code} scanned successfully for inbound ${inboundId}. Awaiting location scan.`);
  
  return {
    message: "Item scanned successfully, please scan location QR code",
    pending_location: true,
    item: {
      id: item.id,
      rfid_tag: item.rfid_tag,
      item_name: item.item_name,
      sku_code: item.sku_code,
      category: item.category,
      uom: item.uom,
    },
    inbound_item: {
      id: inboundItem.id,
      qty_target: inboundItem.qty_target,
      qty_received: inboundItem.qty_received,
      qty_remaining: inboundItem.qty_target - inboundItem.qty_received,
    },
  };
};

module.exports = { scanItem };