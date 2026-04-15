"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create staging_sessions table
    await queryInterface.createTable("staging_sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      session_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "OPEN",
      },
      created_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 2. Create staging_items table
    await queryInterface.createTable("staging_items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      staging_session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "staging_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      rfid_tag: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      outbound_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "outbound_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "locations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "STAGED",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 3. Create staging_audit_logs table
    await queryInterface.createTable("staging_audit_logs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      staging_session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "staging_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add constraints for status
    await queryInterface.sequelize.query(`
      ALTER TABLE staging_sessions 
      ADD CONSTRAINT staging_sessions_status_check 
      CHECK (status IN ('OPEN', 'CLOSED', 'FINALIZED'))
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE staging_items 
      ADD CONSTRAINT staging_items_status_check 
      CHECK (status IN ('STAGED', 'FINALIZED'))
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("staging_audit_logs");
    await queryInterface.dropTable("staging_items");
    await queryInterface.dropTable("staging_sessions");
  },
};
