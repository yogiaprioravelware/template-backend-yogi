const { Outbound, OutboundItem, Item } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil detail Outbound order beserta item dan metadata produk menggunakan Eager Loading.
 * @param {number} outboundId 
 * @returns {Promise<Object>}
 */
const getOutboundDetail = async (outboundId) => {
  logger.info(`Fetching details for outbound ID: ${outboundId}`);

  const outbound = await Outbound.findByPk(outboundId, {
    include: [
      {
        model: OutboundItem,
        as: "items",
        attributes: ["id", "sku_code", "qty_target", "qty_delivered"],
        include: [
          {
            model: Item,
            as: "metadata",
            attributes: ["item_name", "category", "uom", "current_stock"],
          },
        ],
      },
    ],
  });

  if (!outbound) {
    logger.warn(`Outbound with ID: ${outboundId} not found`);
    const err = new Error("Outbound not found");
    err.status = 400;
    throw err;
  }

  const data = outbound.toJSON();
  
  // Transformasi items dan kalkulasi statistik
  let totalQtyTarget = 0;
  let totalQtyDelivered = 0;

  data.items = data.items.map(item => {
    const qtyTarget = Number(item.qty_target) || 0;
    const qtyDelivered = Number(item.qty_delivered) || 0;
    
    totalQtyTarget += qtyTarget;
    totalQtyDelivered += qtyDelivered;

    return {
      id: item.id,
      sku_code: item.sku_code,
      qty_target: qtyTarget,
      qty_delivered: qtyDelivered,
      item_name: item.metadata?.item_name || "",
      category: item.metadata?.category || "",
      uom: item.metadata?.uom || "",
      current_stock: item.metadata?.current_stock || 0,
    };
  });

  const progressPercentage = totalQtyTarget > 0 ? Math.round((totalQtyDelivered / totalQtyTarget) * 100) : 0;

  logger.info(`Found ${data.items.length} items for outbound ID: ${outboundId}`);
  
  return {
    ...data,
    total_qty_target: totalQtyTarget,
    total_qty_delivered: totalQtyDelivered,
    progress_percentage: progressPercentage
  };
};

module.exports = getOutboundDetail;
