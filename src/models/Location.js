const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const Location = sequelize.define(
  "Location",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    location_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    qr_string: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    warehouse: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rack: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "ACTIVE",
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
    tableName: "locations",
    timestamps: false,
  }
);


Location.associate = (models) => {
  Location.belongsToMany(models.Item, {
    through: models.ItemLocation,
    foreignKey: "location_id",
    otherKey: "item_id",
    as: "items",
  });
};

module.exports = Location;
