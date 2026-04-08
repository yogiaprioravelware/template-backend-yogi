const Item = require("../../models/Item");
const Location = require("../../models/Location");
const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const InboundReceivingLog = require("../../models/InboundReceivingLog");
const { errorResponse } = require("../../utils/response");
const logger = require("../../utils/logger");

const setLocation = async (inboundId, inboundItemId, qrString) => {
  logger.info(`Setting location for inbound item ${inboundItemId} in inbound ${inboundId} with QR string: ${qrString}`);
  try {
    // Find location by qr_string
    const location = await Location.findOne({
      where: { qr_string: qrString },
    });

    if (!location) {
      logger.warn(`Set location failed: Location with QR string ${qrString} not found`);
      return errorResponse(400, "Location not found", {
        message: "Lokasi dengan QR code tidak ditemukan",
      });
    }

    if (location.status !== "ACTIVE") {
      logger.warn(`Set location failed: Location ${location.location_code} is inactive`);
      return errorResponse(400, "Location is inactive", {
        message: "Lokasi tidak aktif untuk penerimaan",
      });
    }

    // Find inbound and inbound_item
    const inbound = await Inbound.findByPk(inboundId);
    if (!inbound) {
      logger.warn(`Set location failed: Inbound with id ${inboundId} not found`);
      return errorResponse(400, "Inbound not found", {
        message: "PO tidak ditemukan",
      });
    }

    const inboundItem = await InboundItem.findOne({
      where: {
        id: inboundItemId,
        inbound_id: inboundId,
      },
    });

    if (!inboundItem) {
      logger.warn(`Set location failed: Inbound item with id ${inboundItemId} not found in inbound ${inboundId}`);
      return errorResponse(400, "Inbound item not found", {
        message: "Item dalam PO tidak ditemukan",
      });
    }

    // Check if qty_received already equals qty_target
    if (inboundItem.qty_received >= inboundItem.qty_target) {
      logger.warn(`Set location failed: Quantity for inbound item ${inboundItemId} already completed`);
      return errorResponse(400, "Item quantity already completed", {
        message: `Jumlah penerimaan untuk SKU sudah mencapai target`,
      });
    }

    // Update qty_received +1
    inboundItem.qty_received += 1;
    await inboundItem.save();
    logger.info(`Inbound item ${inboundItemId} quantity updated to ${inboundItem.qty_received}`);

    // Create InboundReceivingLog entry
    await InboundReceivingLog.create({
      inbound_item_id: inboundItem.id,
      location_id: location.id,
      qty_received: 1,
      received_at: new Date(),
    });
    logger.info(`Inbound receiving log created for inbound item ${inboundItemId} at location ${location.id}`);

    // Update item current_stock +1
    const item = await Item.findOne({
      where: { sku_code: inboundItem.sku_code },
    });

    if (item) {
      item.current_stock += 1;
      await item.save();
      logger.info(`Item stock for SKU ${item.sku_code} updated to ${item.current_stock}`);
    }

    // Check if all inbound_items are complete
    const allInboundItems = await InboundItem.findAll({
      where: { inbound_id: inboundId },
    });

    const allComplete = allInboundItems.every(
      (ii) => ii.qty_received >= ii.qty_target
    );

    // Update inbound status if all complete
    if (allComplete) {
      inbound.status = "DONE";
      await inbound.save();
      logger.info(`Inbound ${inboundId} status updated to DONE`);
    } else if (inbound.status === "PENDING") {
      // Set to PROCES if any item is partially received
      inbound.status = "PROCES";
      await inbound.save();
      logger.info(`Inbound ${inboundId} status updated to PROCES`);
    }

    // Count completed items
    const completedCount = allInboundItems.filter(
      (ii) => ii.qty_received >= ii.qty_target
    ).length;

    logger.info(`Item received successfully for inbound ${inboundId}`);
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