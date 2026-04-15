const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "role_permissions",
    timestamps: false,
  }
);


RolePermission.associate = (models) => {
  RolePermission.belongsTo(models.Role, { foreignKey: "role_id" });
  RolePermission.belongsTo(models.Permission, { foreignKey: "permission_id" });
};

module.exports = RolePermission;
