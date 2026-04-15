const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const OutboundLog = sequelize.define(
  "OutboundLog",
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
    rfid_tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    staging_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: "outbound_logs",
    timestamps: false,
  }
);

OutboundLog.associate = (models) => {
  OutboundLog.belongsTo(models.Outbound, {
    foreignKey: "outbound_id",
    as: "outbound",
  });
  OutboundLog.belongsTo(models.Location, {
    foreignKey: "location_id",
    as: "location",
  });
};

module.exports = OutboundLog;
