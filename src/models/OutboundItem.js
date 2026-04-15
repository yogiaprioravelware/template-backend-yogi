const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const OutboundItem = sequelize.define(
  "OutboundItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    outbound_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sku_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qty_target: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qty_delivered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    qty_staged: {
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
    tableName: "outbound_items",
    timestamps: false,
  }
);


OutboundItem.associate = (models) => {
  OutboundItem.belongsTo(models.Outbound, {
    foreignKey: "outbound_id",
    as: "outbound",
  });
  OutboundItem.belongsTo(models.Item, {
    foreignKey: "sku_code",
    targetKey: "sku_code",
    as: "metadata",
  });
};

module.exports = OutboundItem;
