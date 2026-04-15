const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const InboundItem = sequelize.define(
  "InboundItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    inbound_id: {
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
    qty_received: {
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
    tableName: "inbound_items",
    timestamps: false,
  }
);


InboundItem.associate = (models) => {
  InboundItem.belongsTo(models.Inbound, {
    foreignKey: "inbound_id",
    as: "inbound",
  });
  InboundItem.belongsTo(models.Item, {
    foreignKey: "sku_code",
    targetKey: "sku_code",
    as: "metadata",
  });
};

module.exports = InboundItem;
