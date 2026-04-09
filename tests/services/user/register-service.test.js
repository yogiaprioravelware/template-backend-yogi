const registerUser = require('../../../src/services/user/register-service');
const User = require('../../../src/models/User');
const Role = require('../../../src/models/Role');
const bcrypt = require('bcryptjs');

jest.mock('../../../src/models/User', () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock('../../../src/models/Role', () => ({ findOne: jest.fn(), findByPk: jest.fn() }));
jest.mock('bcryptjs');
jest.mock('../../../src/utils/logger');

describe('Service: register-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    const invalidData = { email: 'notanemail' };
    await expect(registerUser(invalidData)).rejects.toThrow();
  });

  it('should throw error if email already exists', async () => {
    User.findOne.mockResolvedValue({ id: 1 }); // User exists
    const validData = { name: 'Test', email: 'test@test.com', password: 'password123' };
    await expect(registerUser(validData)).rejects.toThrow('Email already in use');
  });

  it('should register user with provided role_id', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_pw');
    Role.findByPk.mockResolvedValue({ id: 2, name: 'admin' });
    
    const mockCreatedUser = { id: 1, name: 'Test', role: 'admin', role_id: 2 };
    User.create.mockResolvedValue(mockCreatedUser);

    const validData = { name: 'Test', email: 'test@test.com', password: 'password123', role_id: 2 };
    const result = await registerUser(validData);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(Role.findByPk).toHaveBeenCalledWith(2);
    expect(User.create).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@test.com',
      password: 'hashed_pw',
      role: 'admin',
      role_id: 2
    });
    expect(result).toEqual(mockCreatedUser);
  });

  it('should register user with default role if role_id not provided', async () => {
    User.findOne.mockResolvedValue(null); // No existing email
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, name: 'operator' }); // For Role.findOne
    
    Role.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'operator' });
    bcrypt.hash.mockResolvedValue('hashed_pw');
    User.create.mockResolvedValue({ id: 1, role: 'operator' });

    const validData = { name: 'Test', email: 'test@test.com', password: 'password123' };
    await registerUser(validData);

    expect(Role.findOne).toHaveBeenCalledWith({ where: { name: 'operator' } });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: 'operator',
      role_id: 1
    }));
  });
});
