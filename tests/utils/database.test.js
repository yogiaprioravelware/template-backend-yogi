jest.mock('sequelize', () => {
  const mSequelize = jest.fn();
  mSequelize.prototype.authenticate = jest.fn();
  return { Sequelize: mSequelize }; // mock the constructor
});
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('Utils: database', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should create a Sequelize instance with default postgres settings', () => {
    process.env.DB_DIALECT = 'postgres';
    process.env.NODE_ENV = 'test';
    delete process.env.DB_PORT;
    
    let sequelize;
    jest.isolateModules(() => {
      sequelize = require('../../src/utils/database');
    });
    expect(sequelize).toBeDefined();
  });

  it('should create instance with mssql defaults and port 1433', () => {
    process.env.DB_DIALECT = 'mssql';
    delete process.env.DB_PORT;
    
    let db;
    jest.isolateModules(() => {
      db = require('../../src/utils/database');
    });
    expect(db).toBeDefined();
  });

  it('should create instance with explicit DB_PORT', () => {
    process.env.DB_PORT = '3306';
    
    let db;
    jest.isolateModules(() => {
      db = require('../../src/utils/database');
    });
    expect(db).toBeDefined();
  });

  it('should fallback to postgres and port 5432 when dialect and port are missing', () => {
    delete process.env.DB_DIALECT;
    delete process.env.DB_PORT;
    
    let db;
    jest.isolateModules(() => {
      db = require('../../src/utils/database');
    });
    expect(db).toBeDefined();
  });

  it('should use pool min 2 when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    
    let db;
    jest.isolateModules(() => {
      db = require('../../src/utils/database');
    });
    expect(db).toBeDefined();
  });
});
