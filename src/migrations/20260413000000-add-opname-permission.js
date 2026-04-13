'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Insert the new permission
      await queryInterface.bulkInsert('permissions', [
        {
          name: 'item:opname',
          module: 'item',
          action: 'opname',
          description: 'Permission to perform Stock Opname actions'
        }
      ], { transaction });

      // 2. Get the newly created permission id
      const permissionId = await queryInterface.rawSelect('permissions', {
        where: { name: 'item:opname' },
        transaction
      }, ['id']);

      // 3. Get admin role id
      const adminRoleId = await queryInterface.rawSelect('roles', {
        where: { name: 'admin' },
        transaction
      }, ['id']);

      // 4. Assign to admin role
      await queryInterface.bulkInsert('role_permissions', [
        {
          role_id: adminRoleId,
          permission_id: permissionId
        }
      ], { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        "DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE name = 'item:opname')",
        { transaction }
      );
      await queryInterface.sequelize.query(
        "DELETE FROM permissions WHERE name = 'item:opname'",
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
