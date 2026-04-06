exports.up = (pgm) => {
  // Create outbounds table (header order)
  pgm.createTable("outbounds", {
    id: "id",
    order_number: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    outbound_type: {
      type: "varchar(50)",
      notNull: true,
    },
    status: {
      type: "varchar(50)",
      notNull: true,
      default: "PENDING",
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

  // Add constraint untuk enum status
  pgm.sql(`
    ALTER TABLE outbounds 
    ADD CONSTRAINT outbounds_status_check 
    CHECK (status IN ('PENDING', 'PROCES', 'DONE'))
  `);

  // Add constraint untuk enum outbound_type
  pgm.sql(`
    ALTER TABLE outbounds 
    ADD CONSTRAINT outbounds_type_check 
    CHECK (outbound_type IN ('LUNAS', 'PINJAM', 'RETURN'))
  `);

  // Create outbound_items table (detail per sku)
  pgm.createTable("outbound_items", {
    id: "id",
    outbound_id: {
      type: "integer",
      notNull: true,
      references: '"outbounds"(id)',
      onDelete: "CASCADE",
    },
    sku_code: {
      type: "varchar(255)",
      notNull: true,
      references: '"items"(sku_code)',
      onDelete: "RESTRICT",
    },
    qty_target: {
      type: "integer",
      notNull: true,
    },
    qty_delivered: {
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

  // Add index untuk performa query
  pgm.createIndex("outbound_items", "outbound_id");
  pgm.createIndex("outbound_items", "sku_code");
  pgm.createIndex("outbounds", "status");
};

exports.down = (pgm) => {
  pgm.dropTable("outbound_items");
  pgm.dropTable("outbounds");
};
