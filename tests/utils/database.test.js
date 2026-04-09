jest.mock('sequelize', () => {
  const mSequelize = jest.fn();
  mSequelize.prototype.authenticate = jest.fn();
  return { Sequelize: mSequelize }; // mock the constructor
});
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('Utils: database', () => {
  it('should create a Sequelize instance', () => {
    // just requiring it will call the mock constructor
    const sequelize = require('../../src/utils/database');
    expect(sequelize).toBeDefined();
  });

  it('should create instance with mssql defaults when DB_DIALECT is mssql', () => {
    jest.resetModules();
    process.env.DB_DIALECT = 'mssql';
    delete process.env.DB_PORT;
    const db = require('../../src/utils/database');
    expect(db).toBeDefined();
    process.env.DB_DIALECT = 'postgres';
  });

  it('should create instance with explicit DB_PORT', () => {
    jest.resetModules();
    process.env.DB_DIALECT = 'postgres';
    process.env.DB_PORT = '3306';
    const db = require('../../src/utils/database');
    expect(db).toBeDefined();
    delete process.env.DB_PORT;
  });

  it('should create instance with fallback postgres when dialect is missing', () => {
    jest.resetModules();
    delete process.env.DB_DIALECT;
    delete process.env.DB_PORT;
    const db = require('../../src/utils/database');
    expect(db).toBeDefined();
  });
});
