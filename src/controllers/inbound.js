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

const scanItem = async (req, res, next) => {
  logger.info(`Scanning item for inbound: ${req.params.inboundId}`);
  try {
    // Validasi sudah ditangani oleh middleware validation
    const result = await inboundService.scanItem(
      req.params.inboundId,
      req.body.rfid_tag
    );
    
    // Jika service mengembalikan error terstruktur
    if (result && result.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(response.success(result.data, "Item scanned successfully"));
  } catch (err) {
    next(err);
  }
};

const setLocation = async (req, res, next) => {
  logger.info(`Setting location for inbound: ${req.params.inboundId}`);
  try {
    // Validasi sudah ditangani oleh middleware validation
    const result = await inboundService.setLocation(
      req.params.inboundId,
      req.body.inbound_item_id,
      req.body.qr_string
    );

    if (result && result.success === false) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(response.success(result.data, "Location set successfully"));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInbound,
  getInbounds,
  getInboundDetail,
  scanItem,
  setLocation,
};