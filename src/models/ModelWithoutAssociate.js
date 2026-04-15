const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const ModelWithoutAssociate = sequelize.define(
  "ModelWithoutAssociate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "model_without_associate",
    timestamps: false,
  }
);

module.exports = ModelWithoutAssociate;