/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create roles table
  pgm.createTable("roles", {
    id: "id", // shorthand for serial primary key
    name: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create permissions table
  pgm.createTable("permissions", {
    id: "id",
    name: { type: "varchar(100)", notNull: true, unique: true }, // e.g. 'item:create'
    module: { type: "varchar(50)", notNull: true }, // e.g. 'item'
    action: { type: "varchar(50)", notNull: true }, // e.g. 'create'
    description: { type: "text" },
  });

  // Create role_permissions table
  pgm.createTable("role_permissions", {
    id: "id",
    role_id: {
      type: "integer",
      notNull: true,
      references: '"roles"',
      onDelete: "cascade",
    },
    permission_id: {
      type: "integer",
      notNull: true,
      references: '"permissions"',
      onDelete: "cascade",
    },
  });

  // Add role_id to users
  pgm.addColumn("users", {
    role_id: {
      type: "integer",
      references: '"roles"',
      onDelete: "set null",
    },
  });

  // Insert initial roles
  pgm.sql("INSERT INTO roles (name, description) VALUES ('admin', 'Administrator with full access')");
  pgm.sql("INSERT INTO roles (name, description) VALUES ('operator', 'Warehouse operator with restricted access')");

  // Insert initial permissions for 'item' module
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('item:create', 'item', 'create')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('item:read', 'item', 'read')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('item:update', 'item', 'update')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('item:delete', 'item', 'delete')");

  // Insert initial permissions for 'user' module
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('user:create', 'user', 'create')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('user:read', 'user', 'read')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('user:update', 'user', 'update')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('user:delete', 'user', 'delete')");

  // Insert initial permissions for 'location' module
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('location:create', 'location', 'create')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('location:read', 'location', 'read')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('location:update', 'location', 'update')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('location:delete', 'location', 'delete')");

  // Insert initial permissions for 'inbound' module
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('inbound:create', 'inbound', 'create')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('inbound:read', 'inbound', 'read')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('inbound:update', 'inbound', 'update')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('inbound:delete', 'inbound', 'delete')");

  // Insert initial permissions for 'outbound' module
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('outbound:create', 'outbound', 'create')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('outbound:read', 'outbound', 'read')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('outbound:update', 'outbound', 'update')");
  pgm.sql("INSERT INTO permissions (name, module, action) VALUES ('outbound:delete', 'outbound', 'delete')");

  // Assign all permissions to admin
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
  `);

  // Assign only 'read' permissions to operator (default)
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'operator' AND p.action = 'read'
  `);
};

exports.down = (pgm) => {
  pgm.dropColumn("users", "role_id");
  pgm.dropTable("role_permissions");
  pgm.dropTable("permissions");
  pgm.dropTable("roles");
};
