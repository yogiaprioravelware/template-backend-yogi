const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const Item = sequelize.define(
  "Item",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rfid_tag: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    item_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uom: {
      type: DataTypes.ENUM("PCS", "BOX", "SET"),
      allowNull: false,
      defaultValue: "PCS",
    },
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },

  {
    tableName: "items",
    timestamps: false,
  }
);

const Location = require("./Location");
const ItemLocation = require("./ItemLocation");
const InventoryMovement = require("./InventoryMovement");

Item.belongsToMany(Location, {
  through: ItemLocation,
  foreignKey: "item_id",
  otherKey: "location_id",
  as: "locations",
});

Item.hasMany(InventoryMovement, {
  foreignKey: "item_id",
  as: "movements",
});

InventoryMovement.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

InventoryMovement.belongsTo(Location, {
  foreignKey: "location_id",
  as: "location",
});

module.exports = Item;
