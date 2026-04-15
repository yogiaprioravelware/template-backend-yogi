const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "permissions",
    timestamps: false,
  }
);


Permission.associate = (models) => {
  Permission.belongsToMany(models.Role, {
    through: models.RolePermission,
    foreignKey: "permission_id",
    otherKey: "role_id",
    as: "roles",
  });
};

module.exports = Permission;
