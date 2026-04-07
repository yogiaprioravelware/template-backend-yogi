const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    return queryInterface.bulkInsert("users", [
      {
        name: "Admin Warehouse",
        email: "admin@warehouse.com",
        password: hashedPassword,
        role: "admin",
        role_id: 1,
        created_at: new Date(),
      },
      {
        name: "Operator Penerimaan",
        email: "operator1@warehouse.com",
        password: hashedPassword,
        role: "operator",
        role_id: 2,
        created_at: new Date(),
      },
      {
        name: "Operator Pengiriman",
        email: "operator2@warehouse.com",
        password: hashedPassword,
        role: "operator",
        role_id: 2,
        created_at: new Date(),
      },
      {
        name: "Operator Inventory",
        email: "operator3@warehouse.com",
        password: hashedPassword,
        role: "operator",
        role_id: 2,
        created_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("users", null, {});
  },
};
