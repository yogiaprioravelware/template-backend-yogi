/**
 * Centralized Permission Constants
 * Used for both backend authorize middleware and frontend ACL mapping
 */
const PERMISSIONS = {
  // USER permissions
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // ITEM permissions
  ITEM_CREATE: "item:create",
  ITEM_READ: "item:read",
  ITEM_UPDATE: "item:update",
  ITEM_DELETE: "item:delete",
  ITEM_OPNAME: "item:opname",

  // LOCATION permissions
  LOCATION_CREATE: "location:create",
  LOCATION_READ: "location:read",
  LOCATION_UPDATE: "location:update",
  LOCATION_DELETE: "location:delete",

  // ROLE & PERMISSION management
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",

  // INBOUND permissions
  INBOUND_CREATE: "inbound:create",
  INBOUND_READ: "inbound:read",
  INBOUND_UPDATE: "inbound:update",

  // OUTBOUND permissions
  OUTBOUND_CREATE: "outbound:create",
  OUTBOUND_READ: "outbound:read",
  OUTBOUND_UPDATE: "outbound:update",
  
  // LOGS & SYSTEM
  LOGS_READ: "logs:read",
};

module.exports = PERMISSIONS;
