const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const Inbound = sequelize.define(
  "Inbound",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    po_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    tableName: "inbounds",
    timestamps: false,
  }
);


Inbound.associate = (models) => {
  Inbound.hasMany(models.InboundItem, {
    foreignKey: "inbound_id",
    as: "items",
  });
};

module.exports = Inbound;
