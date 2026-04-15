const { sequelize, Outbound, OutboundItem } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil daftar Outbound order dengan ringkasan statistik dan dukungan pagination.
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Promise<Object>}
 */
const getOutbounds = async ({ page = 1, limit = 10 } = {}) => {
  logger.info(`Fetching outbounds with pagination: page=${page}, limit=${limit}`);

  const offset = (page - 1) * limit;

  // Mengambil data utama dengan pagination
  const { count, rows: outbounds } = await Outbound.findAndCountAll({
    attributes: ["id", "order_number", "outbound_type", "status", "created_at", "updated_at"],
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

  const outboundIds = outbounds.map(o => o.id);

  // Mengambil statistik untuk ID yang ada di halaman ini saja
  const stats = await OutboundItem.findAll({
    where: { outbound_id: outboundIds },
    attributes: [
      "outbound_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "item_count"],
      [sequelize.fn("SUM", sequelize.col("qty_target")), "total_qty_target"],
      [sequelize.fn("SUM", sequelize.col("qty_delivered")), "total_qty_delivered"],
    ],
    group: ["outbound_id"],
    raw: true
  });

  const statsMap = stats.reduce((acc, curr) => {
    acc[curr.outbound_id] = curr;
    return acc;
  }, {});

  const data = outbounds.map((outbound) => {
    const s = statsMap[outbound.id] || {};
    const totalTarget = Number.parseInt(s.total_qty_target || 0);
    const totalDelivered = Number.parseInt(s.total_qty_delivered || 0);

    return {
      ...outbound,
      item_count: Number.parseInt(s.item_count || 0),
      total_qty_target: totalTarget,
      total_qty_delivered: totalDelivered,
      progress_percentage: totalTarget > 0 ? Math.round((totalDelivered / totalTarget) * 100) : 0
    };
  });

  logger.info(`Returning ${data.length} outbounds out of ${count} total`);
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

module.exports = getOutbounds;