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

const scanQrPicking = async (req, res, next) => {
  logger.info(`Scanning item for picking in outbound: ${req.params.outboundId}`);
  try {
    const result = await outboundService.scanQrPicking(
      req.params.outboundId, 
      req.body.qr_string, 
      req.body.rfid_tag
    );
    
    if (result?.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(response.success(result, "Item picked successfully"));
  } catch (err) {
    next(err);
  }
};

const scanRfidStaging = async (req, res, next) => {
  logger.info(`Scanning item for staging: ${req.body.rfid_tag}`);
  try {
    const result = await outboundService.scanRfidStaging(req.body.rfid_tag);
    
    if (result?.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(response.success(result, "Item successfully staged"));
  } catch (err) {
    next(err);
  }
};

const finalizeOutbound = async (req, res, next) => {
  logger.info(`Finalizing outbound order: ${req.params.id}`);
  try {
    const result = await outboundService.finalizeOutbound(req.params.id, req.user?.id);
    
    if (result?.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(response.success(result, "Outbound order finalized and stock deducted successfully"));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOutbound,
  getOutbounds,
  getOutboundDetail,
  scanQrPicking,
  scanRfidStaging,
  finalizeOutbound,
};