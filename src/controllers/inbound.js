const inboundService = require("../services/inbound");
const response = require("../utils/response");
const logger = require("../utils/logger");
const {
  scanItemSchema,
  setLocationSchema,
} = require("../validations/inbound-validation");


const createInbound = async (req, res, next) => {
  logger.info("Creating a new inbound PO");
  try {
    const result = await inboundService.createInbound(req.body);
    res.status(201).json(response.success(result));
  } catch (err) {
    next(err);
  }
};


const getInbounds = async (req, res, next) => {
  logger.info("Fetching all inbounds");
  try {
    const inbounds = await inboundService.getInbounds();
    res.json(response.success(inbounds));
  } catch (err) {
    next(err);
  }
};


const getInboundDetail = async (req, res, next) => {
  logger.info(`Fetching inbound detail for id: ${req.params.id}`);
  try {
    const detail = await inboundService.getInboundDetail(req.params.id);
    res.json(response.success(detail));
  } catch (err) {
    next(err);
  }
};


const scanItem = async (req, res, next) => {
  logger.info(`Scanning item for inbound: ${req.params.inboundId}`);
  try {
    // Validate request body
    const { error, value } = scanItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const result = await inboundService.scanItem(
      req.params.inboundId,
      value.rfid_tag
    );
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }
    res.json(response.success(result.data));
  } catch (err) {
    next(err);
  }
};


const setLocation = async (req, res, next) => {
  logger.info(`Setting location for inbound: ${req.params.inboundId}`);
  try {
    // Validate request body
    const { error, value } = setLocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    if (!req.body.inbound_item_id) {
      return res.status(400).json({
        success: false,
        message: "inbound_item_id is required",
      });
    }

    const result = await inboundService.setLocation(
      req.params.inboundId,
      req.body.inbound_item_id,
      value.qr_string
    );
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }
    res.json(response.success(result.data));
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