jest.mock('sequelize', () => {
  const mSequelize = jest.fn();
  mSequelize.prototype.authenticate = jest.fn();
  return { Sequelize: mSequelize }; // mock the constructor
});

describe('Utils: database', () => {
  it('should create a Sequelize instance', () => {
    // just requiring it will call the mock constructor
    const sequelize = require('../../src/utils/database');
    expect(sequelize).toBeDefined();
  });
});
