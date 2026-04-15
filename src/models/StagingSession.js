const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const StagingSession = sequelize.define(
  "StagingSession",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "OPEN",
      validate: {
        isIn: [["OPEN", "CLOSED", "FINALIZED"]]
      }
    },
    created_by_id: {
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
    tableName: "staging_sessions",
    timestamps: false,
  }
);


StagingSession.associate = (models) => {
  StagingSession.hasMany(models.StagingItem, {
    foreignKey: "staging_session_id",
    as: "items",
  });
  StagingSession.belongsTo(models.User, {
    foreignKey: "created_by_id",
    as: "creator",
  });
};

module.exports = StagingSession;
