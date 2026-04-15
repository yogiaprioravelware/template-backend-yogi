const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const StagingAuditLog = sequelize.define(
  "StagingAuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    staging_session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue("details");
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue("details", value ? JSON.stringify(value) : null);
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "staging_audit_logs",
    timestamps: false,
  }
);


StagingAuditLog.associate = (models) => {
  StagingAuditLog.belongsTo(models.StagingSession, {
    foreignKey: "staging_session_id",
    as: "session",
  });
  StagingAuditLog.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
};

module.exports = StagingAuditLog;
