module.exports = async () => {
  require("dotenv").config({ path: ".env.test" });

  const { Sequelize } = require("sequelize");
  const bcrypt = require("bcryptjs");
  const dialect = process.env.DB_DIALECT || "postgres";
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || (dialect === "mssql" ? 1433 : 5432);

  const adminDbName = dialect === "mssql" ? "master" : "postgres";
  const adminSequelize = new Sequelize(adminDbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect,
    logging: false,
    dialectOptions: dialect === "mssql" ? {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      }
    } : {},
  });

  try {
    await adminSequelize.authenticate();

    if (dialect === "mssql") {
      const safeDbName = dbName.replace(/]/g, "]]");
      await adminSequelize.query(`
        IF DB_ID(N'${safeDbName}') IS NOT NULL
        BEGIN
          ALTER DATABASE [${safeDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
          DROP DATABASE [${safeDbName}];
        END;
        CREATE DATABASE [${safeDbName}];
      `);
    } else if (dialect === "postgres") {
      await adminSequelize.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}'
          AND pid <> pg_backend_pid();
      `);
      await adminSequelize.query(`DROP DATABASE IF EXISTS "${dbName}";`);
      await adminSequelize.query(`CREATE DATABASE "${dbName}";`);
    }

    await adminSequelize.close();

    const { sequelize, Role, User, Permission, RolePermission } = require("../../src/models");
    const PERMISSIONS = require("../../src/utils/permission");
    await sequelize.authenticate();
    await sequelize.sync();

    const adminRole = await Role.create({ name: "admin" });
    await Role.create({ name: "operator" });

    const permissionRows = Object.values(PERMISSIONS).map((name) => {
      const [module, action] = name.split(":");
      return {
        name,
        module,
        action,
        description: `Auto-seeded permission for ${name}`,
      };
    });
    const createdPermissions = await Permission.bulkCreate(permissionRows, { returning: true });
    await RolePermission.bulkCreate(
      createdPermissions.map((permission) => ({
        role_id: adminRole.id,
        permission_id: permission.id,
      }))
    );

    await User.create({
      name: "Admin E2E",
      email: "admin@e2e.com",
      password: await bcrypt.hash("password123", 10),
      role: "admin",
      role_id: adminRole.id,
    });

    // Close the connection used for setup to avoid open handles
    await sequelize.close();
  } catch (err) {
    console.error("Failed setting up test database:", err);
    throw err;
  } finally {
    try {
      await adminSequelize.close();
      const { sequelize } = require("../../src/models");
      await sequelize.close();
    } catch (_) {
      // ignore cleanup error in setup context
    }
  }
};
