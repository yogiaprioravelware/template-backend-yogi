const { sequelize, Inbound, InboundItem } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil daftar Inbound PO dengan ringkasan statistik dan dukungan pagination.
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Promise<Object>}
 */
const getInbounds = async ({ page = 1, limit = 10 } = {}) => {
  logger.info(`Fetching inbounds with pagination: page=${page}, limit=${limit}`);
  
  const offset = (page - 1) * limit;

  // Mengambil data utama dengan pagination
  const { count, rows: inbounds } = await Inbound.findAndCountAll({
    attributes: ["id", "po_number", "status", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
    limit: Number.parseInt(limit),
    offset: Number.parseInt(offset),
    raw: true
  });

  if (count === 0) {
    return {
      data: [],
      pagination: { total: 0, page, limit }
    };
  }

  const inboundIds = inbounds.map(i => i.id);

  // Mengambil statistik untuk ID yang ada di halaman ini saja (lebih efisien)
  const stats = await InboundItem.findAll({
    where: { inbound_id: inboundIds },
    attributes: [
      "inbound_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "item_count"],
      [sequelize.fn("SUM", sequelize.col("qty_target")), "total_qty_target"],
      [sequelize.fn("SUM", sequelize.col("qty_received")), "total_qty_received"],
    ],
    group: ["inbound_id"],
    raw: true
  });

  const statsMap = stats.reduce((acc, curr) => {
    acc[curr.inbound_id] = curr;
    return acc;
  }, {});

  const data = inbounds.map((inbound) => {
    const s = statsMap[inbound.id] || {};
    const totalTarget = Number.parseInt(s.total_qty_target || 0);
    const totalReceived = Number.parseInt(s.total_qty_received || 0);
    
    return {
      ...inbound,
      item_count: Number.parseInt(s.item_count || 0),
      total_qty_target: totalTarget,
      total_qty_received: totalReceived,
      progress_percentage: totalTarget > 0 ? Math.round((totalReceived / totalTarget) * 100) : 0
    };
  });

  logger.info(`Returning ${data.length} inbounds out of ${count} total`);
  return {
    data,
    pagination: {
      total: count,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total_pages: Math.ceil(count / limit)
    }
  };
};

module.exports = { getInbounds };