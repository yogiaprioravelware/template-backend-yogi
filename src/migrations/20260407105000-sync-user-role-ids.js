'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Sync admin role_id based on 'admin' name in roles table
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role_id = (SELECT id FROM roles WHERE name = 'admin') 
      WHERE role = 'admin'
    `);

    // Sync operator role_id based on 'operator' name in roles table
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role_id = (SELECT id FROM roles WHERE name = 'operator') 
      WHERE role = 'operator'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert role_id to null
    await queryInterface.sequelize.query("UPDATE users SET role_id = NULL");
  }
};
