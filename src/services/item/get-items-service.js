const { Item, Location } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil daftar item dengan dukungan pagination dan relasi lokasi.
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Promise<Object>}
 */
const getItems = async ({ page = 1, limit = 10 } = {}) => {
  logger.info(`Fetching items with pagination: page=${page}, limit=${limit}`);

  const offset = (page - 1) * limit;

  const { count, rows: items } = await Item.findAndCountAll({
    attributes: [
      "id",
      "rfid_tag",
      "item_name",
      "sku_code",
      "category",
      "uom",
      "current_stock",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: Location,
        as: "locations",
        through: { attributes: ["stock"] }, // Ambil stok di lokasi tersebut
      },
    ],
    order: [["created_at", "DESC"]],
    limit: Number.parseInt(limit),
    offset: Number.parseInt(offset),
    distinct: true, // Diperlukan saat menggunakan include hasMany/belongsToMany dengan limit
  });

  logger.info(`Found ${items.length} items out of ${count} total`);
  
  return {
    data: items,
    pagination: {
      total: count,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total_pages: Math.ceil(count / limit)
    }
  };
};

module.exports = getItems;