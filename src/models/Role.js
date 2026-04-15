const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const Role = sequelize.define(
  "Role",
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
    description: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "roles",
    timestamps: false,
  }
);


Role.associate = (models) => {
  Role.hasMany(models.User, { foreignKey: "role_id", as: "users" });
  Role.belongsToMany(models.Permission, {
    through: models.RolePermission,
    foreignKey: "role_id",
    otherKey: "permission_id",
    as: "permissions",
  });
};

module.exports = Role;
