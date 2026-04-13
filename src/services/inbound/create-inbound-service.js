const { Op } = require("sequelize");
const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const Item = require("../../models/Item");
const { createInboundSchema } = require("../../validations/inbound-validation");
const logger = require("../../utils/logger");


const createInbound = async (inboundData) => {
  logger.info("Attempting to create a new inbound PO");
  const { error } = createInboundSchema.validate(inboundData);
  if (error) {
    logger.warn(`Validation error during inbound PO creation: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { po_number, items } = inboundData;

  const existingPo = await Inbound.findOne({ where: { po_number } });
  if (existingPo) {
    logger.warn(`Creation failed: PO number ${po_number} already exists`);
    const err = new Error("PO number already exists");
    err.status = 400;
    throw err;
  }

  const { validateSkusExist } = require("../../utils/item-validator");
  await validateSkusExist(items);

  const inbound = await Inbound.create({
    po_number,
    status: "PENDING",
  });
  logger.info(`Inbound header created for PO number: ${po_number}`);

  await InboundItem.bulkCreate(items.map(item => ({
    inbound_id: inbound.id,
    sku_code: item.sku_code,
    qty_target: item.qty_target,
    qty_received: 0,
  })));
  logger.info(`Inbound items created for PO number: ${po_number}`);

  return inbound;
};

module.exports = { createInbound };