exports.up = (pgm) => {
  // Create inbounds table (header PO)
  pgm.createTable("inbounds", {
    id: "id",
    po_number: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
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
    ALTER TABLE inbounds 
    ADD CONSTRAINT inbounds_status_check 
    CHECK (status IN ('PENDING', 'PROCES', 'DONE'))
  `);

  // Create inbound_items table (detail per sku)
  pgm.createTable("inbound_items", {
    id: "id",
    inbound_id: {
      type: "integer",
      notNull: true,
      references: '"inbounds"(id)',
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
    qty_received: {
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
  pgm.createIndex("inbound_items", "inbound_id");
  pgm.createIndex("inbound_items", "sku_code");
  pgm.createIndex("inbounds", "status");
};

exports.down = (pgm) => {
  pgm.dropTable("inbound_items");
  pgm.dropTable("inbounds");
};
