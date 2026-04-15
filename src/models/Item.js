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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PCS",
      validate: {
        isIn: [["PCS", "BOX", "SET"]]
      }
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


Item.associate = (models) => {
  Item.belongsToMany(models.Location, {
    through: models.ItemLocation,
    foreignKey: "item_id",
    otherKey: "location_id",
    as: "locations",
  });
  Item.hasMany(models.InventoryMovement, {
    foreignKey: "item_id",
    as: "movements",
  });
};

module.exports = Item;
