const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "postgres",
    port: process.env.DB_PORT || (process.env.DB_DIALECT === "mssql" ? 1433 : 5432),
    logging: false, 
    define: {
      timestamps: false, 
      underscored: true,
    },
    dialectOptions: process.env.DB_DIALECT === "mssql" ? {
      options: {
        encrypt: false, // Set to true if using Azure
        trustServerCertificate: true,
      }
    } : {},
    pool: {
      max: 10,
      min: process.env.NODE_ENV === "test" ? 0 : 2,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
