exports.up = (pgm) => {
  pgm.createTable("items", {
    id: "id",
    rfid_tag: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    item_name: {
      type: "varchar(255)",
      notNull: true,
    },
    sku_code: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    category: {
      type: "varchar(255)",
      notNull: true,
    },
    uom: {
      type: "varchar(50)",
      notNull: true,
      default: "PCS",
    },
    current_stock: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("items");
};
