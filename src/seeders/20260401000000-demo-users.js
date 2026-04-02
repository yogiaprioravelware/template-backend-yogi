const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    return queryInterface.bulkInsert("users", [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        created_at: new Date(),
      },
      {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        created_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("users", null, {});
  },
};
