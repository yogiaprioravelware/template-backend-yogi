const Item = require("../../models/Item");
const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const { errorResponse } = require("../../utils/response");
const logger = require("../../utils/logger");

const scanItem = async (inboundId, rfidTag) => {
  logger.info(`Scanning item with RFID tag: ${rfidTag} for inbound: ${inboundId}`);
  try {
    // Find inbound and check if it's not DONE
    const inbound = await Inbound.findByPk(inboundId);
    if (!inbound) {
      logger.warn(`Scan failed: Inbound with id ${inboundId} not found`);
      return errorResponse(404, "Inbound not found", {
        message: "PO tidak ditemukan",
      });
    }

    if (inbound.status === "DONE") {
      logger.warn(`Scan failed: Inbound ${inboundId} is already completed`);
      return errorResponse(400, "Inbound already completed", {
        message: "PO sudah selesai, tidak bisa scan lagi",
      });
    }

    // Find item by rfid_tag
    const item = await Item.findOne({
      where: { rfid_tag: rfidTag },
    });

    if (!item) {
      logger.warn(`Scan failed: Item with RFID tag ${rfidTag} not found`);
      return errorResponse(404, "Item not found", {
        message: "Item dengan RFID tag tidak ditemukan",
      });
    }

    // Find inbound_item with matching sku_code in this inbound
    const inboundItem = await InboundItem.findOne({
      where: {
        inbound_id: inboundId,
        sku_code: item.sku_code,
      },
    });

    if (!inboundItem) {
      logger.warn(`Scan failed: Item with SKU ${item.sku_code} not in PO ${inboundId}`);
      return errorResponse(400, "Item not in this PO", {
        message: `SKU ${item.sku_code} tidak ada dalam PO ini`,
      });
    }

    // Check if qty_received already equals qty_target
    if (inboundItem.qty_received >= inboundItem.qty_target) {
      logger.warn(`Scan failed: Quantity for SKU ${item.sku_code} in PO ${inboundId} already completed`);
      return errorResponse(400, "Item quantity already completed", {
        message: `Jumlah penerimaan untuk SKU ${item.sku_code} sudah mencapai target`,
      });
    }

    // Return pending location response
    logger.info(`Item ${item.sku_code} scanned successfully for inbound ${inboundId}. Awaiting location scan.`);
    return {
      success: true,
      statusCode: 200,
      message: "Item scanned successfully, please scan location QR code",
      data: {
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
      },
    };
  } catch (error) {
    logger.error(`Error scanning item for inbound ${inboundId}: ${error.message}`);
    return errorResponse(
      500,
      "Error scanning item",
      { message: error.message },
      error
    );
  }
};

module.exports = { scanItem };