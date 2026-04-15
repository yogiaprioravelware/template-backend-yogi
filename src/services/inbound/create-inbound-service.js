const { Inbound, InboundItem, sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { validateSkusExist } = require("../../utils/item-validator");

/**
 * Membuat dokumen Inbound baru (Purchase Order) beserta daftar itemnya.
 * @param {Object} inboundData 
 * @returns {Promise<Object>}
 */
const createInbound = async (inboundData) => {
  logger.info("Attempting to create a new inbound PO");
  
  const { po_number, items } = inboundData;

  const transaction = await sequelize.transaction();
  try {
    const existingPo = await Inbound.findOne({ where: { po_number }, transaction });
    if (existingPo) {
      logger.warn(`Creation failed: PO number ${po_number} already exists`);
      const err = new Error("PO number already exists");
      err.status = 400;
      throw err;
    }

    await validateSkusExist(items);

    const inbound = await Inbound.create({
      po_number,
      status: "PENDING",
    }, { transaction });

    logger.info(`Inbound header created for PO number: ${po_number}`);

    await InboundItem.bulkCreate(items.map(item => ({
      inbound_id: inbound.id,
      sku_code: item.sku_code,
      qty_target: item.qty_target,
      qty_received: 0,
    })), { transaction });

    logger.info(`Inbound items created for PO number: ${po_number}`);

    await transaction.commit();
    return inbound;
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Inbound PO creation failed: ${error.message}`);
    throw error;
  }
};

module.exports = { createInbound };