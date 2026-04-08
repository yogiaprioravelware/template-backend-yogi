'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create roles table
      await queryInterface.createTable('roles', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 2. Create permissions table
      await queryInterface.createTable('permissions', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        module: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        }
      }, { transaction });

      // 3. Create role_permissions table
      await queryInterface.createTable('role_permissions', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'roles',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        permission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'permissions',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // 4. Add role_id to users
      await queryInterface.addColumn('users', 'role_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }, { transaction });

      // 5. Insert initial roles
      await queryInterface.bulkInsert('roles', [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'operator', description: 'Warehouse operator with restricted access' }
      ], { transaction });

      // 6. Insert initial permissions
      const initialPermissions = [
        // item
        { name: 'item:create', module: 'item', action: 'create' },
        { name: 'item:read', module: 'item', action: 'read' },
        { name: 'item:update', module: 'item', action: 'update' },
        { name: 'item:delete', module: 'item', action: 'delete' },
        // user
        { name: 'user:create', module: 'user', action: 'create' },
        { name: 'user:read', module: 'user', action: 'read' },
        { name: 'user:update', module: 'user', action: 'update' },
        { name: 'user:delete', module: 'user', action: 'delete' },
        // location
        { name: 'location:create', module: 'location', action: 'create' },
        { name: 'location:read', module: 'location', action: 'read' },
        { name: 'location:update', module: 'location', action: 'update' },
        { name: 'location:delete', module: 'location', action: 'delete' },
        // inbound
        { name: 'inbound:create', module: 'inbound', action: 'create' },
        { name: 'inbound:read', module: 'inbound', action: 'read' },
        { name: 'inbound:update', module: 'inbound', action: 'update' },
        { name: 'inbound:delete', module: 'inbound', action: 'delete' },
        // outbound
        { name: 'outbound:create', module: 'outbound', action: 'create' },
        { name: 'outbound:read', module: 'outbound', action: 'read' },
        { name: 'outbound:update', module: 'outbound', action: 'update' },
        { name: 'outbound:delete', module: 'outbound', action: 'delete' }
      ];
      await queryInterface.bulkInsert('permissions', initialPermissions, { transaction });

      // 7. Assign permissions to admin (All)
      await queryInterface.sequelize.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p 
        WHERE r.name = 'admin'
      `, { transaction });

      // 8. Assign permissions to operator (Read only)
      await queryInterface.sequelize.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p 
        WHERE r.name = 'operator' AND p.action = 'read'
      `, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('users', 'role_id', { transaction });
      await queryInterface.dropTable('role_permissions', { transaction });
      await queryInterface.dropTable('permissions', { transaction });
      await queryInterface.dropTable('roles', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
