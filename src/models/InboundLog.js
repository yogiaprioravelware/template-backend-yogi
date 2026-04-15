const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const InboundLog = sequelize.define(
  "InboundLog",
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
    rfid_tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
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
    tableName: "inbound_logs",
    timestamps: false,
  }
);

InboundLog.associate = (models) => {
  InboundLog.belongsTo(models.Inbound, {
    foreignKey: "inbound_id",
    as: "inbound",
  });
  InboundLog.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
  InboundLog.belongsTo(models.Location, {
    foreignKey: "location_id",
    as: "location",
  });
};

module.exports = InboundLog;
