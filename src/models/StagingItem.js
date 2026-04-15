const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");

const StagingItem = sequelize.define(
  "StagingItem",
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
    rfid_tag: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    outbound_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "STAGED",
      validate: {
        isIn: [["STAGED", "FINALIZED"]]
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
    tableName: "staging_items",
    timestamps: false,
  }
);


StagingItem.associate = (models) => {
  StagingItem.belongsTo(models.StagingSession, {
    foreignKey: "staging_session_id",
    as: "session",
  });
  StagingItem.belongsTo(models.Location, {
    foreignKey: "location_id",
    as: "location",
  });
  StagingItem.belongsTo(models.OutboundItem, {
    foreignKey: "outbound_item_id",
    as: "outbound_item",
  });
};

module.exports = StagingItem;
