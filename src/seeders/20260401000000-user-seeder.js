'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Clear existing users safely
    await queryInterface.bulkDelete('users', null, {});

    // Get role IDs
    const [roles] = await queryInterface.sequelize.query('SELECT id, name FROM roles');
    const adminRole = roles.find(r => r.name === 'admin');
    const operatorRole = roles.find(r => r.name === 'operator');

    const users = [
      {
        name: 'Admin Warehouse',
        email: 'admin@warehouse.com',
        password: hashedPassword,
        role: 'admin',
        role_id: adminRole ? adminRole.id : null,
        created_at: new Date()
      }
    ];

    for (let i = 1; i <= 9; i++) {
      users.push({
        name: `Operator ${i}`,
        email: `operator${i}@warehouse.com`,
        password: hashedPassword,
        role: 'operator',
        role_id: operatorRole ? operatorRole.id : null,
        created_at: new Date()
      });
    }

    return queryInterface.bulkInsert('users', users);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', null, {});
  }
};
