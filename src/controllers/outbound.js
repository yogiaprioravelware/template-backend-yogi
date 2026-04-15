const outboundService = require("../services/outbound");
const response = require("../utils/response");
const logger = require("../utils/logger");

const createOutbound = async (req, res, next) => {
  logger.info("Creating a new outbound order");
  try {
    const result = await outboundService.createOutbound(req.body);
    res.status(201).json(response.success(result, "Outbound order created successfully"));
  } catch (err) {
    next(err);
  }
};

const getOutbounds = async (req, res, next) => {
  const { page, limit } = req.query;
  logger.info(`Fetching outbounds - Page: ${page || 1}, Limit: ${limit || 10}`);
  try {
    const result = await outboundService.getOutbounds({ page, limit });
    res.json(response.success(result.data, "Outbounds fetched successfully", { pagination: result.pagination }));
  } catch (err) {
    next(err);
  }
};

const getOutboundDetail = async (req, res, next) => {
  logger.info(`Fetching outbound detail for id: ${req.params.id}`);
  try {
    const detail = await outboundService.getOutboundDetail(req.params.id);
    res.json(response.success(detail, "Outbound detail fetched successfully"));
  } catch (err) {
    next(err);
  }
};

const scanRfidPicking = async (req, res, next) => {
  logger.info(`Scanning RFID for picking in outbound: ${req.params.outboundId}`);
  try {
    const result = await outboundService.scanRfidPicking(req.params.outboundId, req.body, req.user?.id || 1);
    
    if (result && result.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(response.success(result.data || result, "RFID scanned and item picked successfully"));
  } catch (err) {
    next(err);
  }
};

const finalizeOrderSync = async (req, res, next) => {
  logger.info(`Finalizing and syncing outbound order: ${req.params.id}`);
  try {
    const result = await outboundService.finalizeOrderSync(req.params.id, req.user?.id || 1);
    
    if (result && result.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(response.success(result.data || result, "Outbound order finalized and synced successfully"));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOutbound,
  getOutbounds,
  getOutboundDetail,
  scanRfidPicking,
  finalizeOrderSync,
};