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
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["LUNAS", "PINJAM", "RETURN"]]
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PENDING",
      validate: {
        isIn: [["PENDING", "PROCESS", "DONE"]]
      }
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


Outbound.associate = (models) => {
  Outbound.hasMany(models.OutboundItem, {
    foreignKey: "outbound_id",
    as: "items",
  });
};

module.exports = Outbound;
