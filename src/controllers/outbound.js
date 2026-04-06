const outboundService = require("../services/outbound");
const response = require("../utils/response");
const logger = require("../utils/logger");

// Membuat order outbound baru
const createOutbound = async (req, res, next) => {
  logger.info("Creating a new outbound order");
  try {
    const result = await outboundService.createOutbound(req.body);
    res.status(201).json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Mengambil semua outbound
const getOutbounds = async (req, res, next) => {
  logger.info("Fetching all outbounds");
  try {
    const outbounds = await outboundService.getOutbounds();
    res.json(response.success(outbounds));
  } catch (err) {
    next(err);
  }
};

// Mengambil detail outbound dengan items
const getOutboundDetail = async (req, res, next) => {
  logger.info(`Fetching outbound detail for id: ${req.params.id}`);
  try {
    const detail = await outboundService.getOutboundDetail(req.params.id);
    res.json(response.success(detail));
  } catch (err) {
    next(err);
  }
};

// Scan RFID dan process picking
const scanRfidPicking = async (req, res, next) => {
  logger.info(`Scanning RFID for picking in outbound: ${req.params.outboundId}`);
  try {
    const result = await outboundService.scanRfidPicking(req.params.outboundId, req.body);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOutbound,
  getOutbounds,
  getOutboundDetail,
  scanRfidPicking,
};