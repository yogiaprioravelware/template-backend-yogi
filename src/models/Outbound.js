const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const Outbound = sequelize.define(
  "Outbound",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    outbound_type: {
      type: DataTypes.ENUM("LUNAS", "PINJAM", "RETURN"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PROCES", "DONE"),
      allowNull: false,
      defaultValue: "PENDING",
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
    tableName: "outbounds",
    timestamps: false,
  }
);

module.exports = Outbound;
