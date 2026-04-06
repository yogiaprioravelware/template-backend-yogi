exports.up = (pgm) => {
  // Create locations table (master lokasi penyimpanan)
  pgm.createTable("locations", {
    id: "id",
    location_code: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    qr_string: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    warehouse: {
      type: "varchar(255)",
      notNull: true,
    },
    rack: {
      type: "varchar(255)",
      notNull: true,
    },
    bin: {
      type: "varchar(255)",
      notNull: true,
    },
    location_name: {
      type: "varchar(255)",
      notNull: true,
    },
    status: {
      type: "varchar(50)",
      notNull: true,
      default: "ACTIVE",
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

  // Create inbound_receiving_log table (history penerimaan per lokasi)
  pgm.createTable("inbound_receiving_log", {
    id: "id",
    inbound_item_id: {
      type: "integer",
      notNull: true,
      references: '"inbound_items"(id)',
      onDelete: "CASCADE",
    },
    location_id: {
      type: "integer",
      notNull: true,
      references: '"locations"(id)',
      onDelete: "RESTRICT",
    },
    qty_received: {
      type: "integer",
      notNull: true,
      default: 1,
    },
    received_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Add index untuk performa query
  pgm.createIndex("locations", "status");
  pgm.createIndex("locations", "qr_string");
  pgm.createIndex("inbound_receiving_log", "inbound_item_id");
  pgm.createIndex("inbound_receiving_log", "location_id");
};

exports.down = (pgm) => {
  pgm.dropTable("inbound_receiving_log");
  pgm.dropTable("locations");
};
