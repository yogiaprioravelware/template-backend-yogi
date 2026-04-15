const { Inbound, InboundItem, Item } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil detail Inbound PO beserta item dan metadata produk menggunakan Eager Loading.
 * @param {number} inboundId 
 * @returns {Promise<Object>}
 */
const getInboundDetail = async (inboundId) => {
  logger.info(`Fetching inbound detail for id: ${inboundId}`);

  const inbound = await Inbound.findByPk(inboundId, {
    include: [
      {
        model: InboundItem,
        as: "items",
        attributes: ["id", "sku_code", "qty_target", "qty_received"],
        include: [
          {
            model: Item,
            as: "metadata",
            attributes: ["item_name", "category", "uom"],
          },
        ],
      },
    ],
  });

  if (!inbound) {
    logger.warn(`Inbound with id: ${inboundId} not found`);
    const err = new Error("Inbound PO not found");
    err.status = 400;
    throw err;
  }

  // Transform data untuk mempertahankan struktur response lama (backward compatibility)
  const result = inbound.toJSON();
  result.items = result.items.map(item => ({
    id: item.id,
    sku_code: item.sku_code,
    qty_target: item.qty_target,
    qty_received: item.qty_received,
    item_name: item.metadata?.item_name || "",
    category: item.metadata?.category || "",
    uom: item.metadata?.uom || "",
  }));

  logger.info(`Found ${result.items.length} items for inbound id: ${inboundId}`);
  return result;
};

module.exports = { getInboundDetail };
