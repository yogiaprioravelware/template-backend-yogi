const inboundService = require("../services/inbound");
const response = require("../utils/response");
const logger = require("../utils/logger");

const createInbound = async (req, res, next) => {
  logger.info("Creating a new inbound PO");
  try {
    const result = await inboundService.createInbound(req.body);
    res.status(201).json(response.success(result, "Inbound PO created successfully"));
  } catch (err) {
    next(err);
  }
};

const getInbounds = async (req, res, next) => {
  const { page, limit } = req.query;
  logger.info(`Fetching inbounds - Page: ${page || 1}, Limit: ${limit || 10}`);
  try {
    const result = await inboundService.getInbounds({ page, limit });
    res.json(response.success(result.data, "Inbounds fetched successfully", { pagination: result.pagination }));
  } catch (err) {
    next(err);
  }
};

const getInboundDetail = async (req, res, next) => {
  logger.info(`Fetching inbound detail for id: ${req.params.id}`);
  try {
    const detail = await inboundService.getInboundDetail(req.params.id);
    res.json(response.success(detail, "Inbound detail fetched successfully"));
  } catch (err) {
    next(err);
  }
};

const scanRfidReceived = async (req, res, next) => {
  logger.info(`Scanning item for inbound (Received Area): ${req.params.inboundId}`);
  try {
    const result = await inboundService.scanRfidReceived(
      req.params.inboundId,
      req.body.rfid_tag,
      req.body.location_id,
      req.user ? req.user.id : null
    );
    
    if (result?.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(response.success(result, "Item scanned at Received Area successfully"));
  } catch (err) {
    next(err);
  }
};

const scanQrStored = async (req, res, next) => {
  logger.info(`Scanning item to store in Rack`);
  try {
    const result = await inboundService.scanQrStored(
      req.body.qr_string,
      req.body.rfid_tag,
      req.user ? req.user.id : null
    );

    if (result?.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(response.success(result, "Item successfully stored at location"));
  } catch (err) {
    next(err);
  }
};

const finalizeInbound = async (req, res, next) => {
  logger.info(`Finalizing inbound PO: ${req.params.id}`);
  try {
    const result = await inboundService.finalizeInbound(
      req.params.id,
      req.user ? req.user.id : null
    );
    res.json(response.success(result, "Inbound PO finalized and stock updated successfully"));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInbound,
  getInbounds,
  getInboundDetail,
  scanRfidReceived,
  scanQrStored,
  finalizeInbound,
};