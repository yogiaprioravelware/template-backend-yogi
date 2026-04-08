require('dotenv').config();

const commonConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || (process.env.DB_DIALECT === 'mssql' ? 1433 : 5432),
  dialect: process.env.DB_DIALECT || 'postgres',
  dialectOptions: process.env.DB_DIALECT === 'mssql' ? {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    }
  } : {},
};

module.exports = {
  development: commonConfig,
  test: commonConfig,
  production: commonConfig,
};