const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const InboundReceivingLog = sequelize.define(
  "InboundReceivingLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    inbound_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qty_received: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    received_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "inbound_receiving_log",
    timestamps: false,
  }
);

module.exports = InboundReceivingLog;
