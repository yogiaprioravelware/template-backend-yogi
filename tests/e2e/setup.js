require("dotenv").config({ path: ".env.test" }); // Akan fokus pada .env.test
const sequelize = require("../../src/utils/database");

// Ini akan dipanggil sebelum semua test E2E/Integration dijalankan
beforeAll(async () => {
  try {
    // Sinkronisasi force untuk database Test
    await sequelize.sync({ force: true });
    
    // Seed data krusial untuk ngetest seperti Role & Admin User
    const Role = require("../../src/models/Role");
    const User = require("../../src/models/User");
    const bcrypt = require("bcryptjs");

    const adminRole = await Role.create({ name: "admin" });
    const operatorRole = await Role.create({ name: "operator" });

    await User.create({
      name: "Admin E2E",
      email: "admin@e2e.com",
      password: await bcrypt.hash("password123", 10),
      role: "admin",
      role_id: adminRole.id
    });
    
  } catch (err) {
    console.error("Failed setting up test database:", err);
  }
});

afterAll(async () => {
  await sequelize.close();
});
