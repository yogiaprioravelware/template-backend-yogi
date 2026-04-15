const loginUser = require('../../../src/services/user/login-service');
const { User } = require('../../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getUserPermissions = require('../../../src/services/role/get-user-permissions-service');

jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/services/role/get-user-permissions-service');

describe('Service: loginUser', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if user is not found', async () => {
    User.findOne.mockResolvedValue(null);

    const validData = { email: 'test@test.com', password: 'password123' };
    await expect(loginUser(validData)).rejects.toThrow('Invalid credentials');
  });

  it('should throw an error if password does not match', async () => {
    const fakeUser = { id: 1, email: 'test@test.com', password: 'hashedpassword' };
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);

    const validData = { email: 'test@test.com', password: 'wrongpassword' };
    await expect(loginUser(validData)).rejects.toThrow('Invalid credentials');
  });

  it('should return a user and token on successful login', async () => {
    const fakeUser = { 
      id: 1, 
      email: 'test@test.com', 
      password: 'hashedpassword', 
      name: 'Test User',
      role_id: 1,
      role: 'admin'
    };
    const fakePermissions = ['create:item', 'read:item'];

    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake_jwt_token');
    getUserPermissions.mockResolvedValue(fakePermissions);

    const validData = { email: 'test@test.com', password: 'password123' };
    
    const result = await loginUser(validData);
    
    expect(result.user).toEqual({
      id: 1,
      email: 'test@test.com',
      name: 'Test User',
      role_id: 1,
      role: 'admin',
      permissions: fakePermissions
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    
    expect(User.findOne).toHaveBeenCalledWith({ where: { email: validData.email } });
    expect(bcrypt.compare).toHaveBeenCalledWith(validData.password, fakeUser.password);
    expect(jwt.sign).toHaveBeenCalledTimes(2);
  });

  it('should use default expiry if env variables are missing (branch coverage)', async () => {
    const originalAccessExpiry = process.env.JWT_ACCESS_EXPIRY;
    const originalRefreshExpiry = process.env.JWT_REFRESH_EXPIRY;
    delete process.env.JWT_ACCESS_EXPIRY;
    delete process.env.JWT_REFRESH_EXPIRY;

    const fakeUser = { id: 1, email: 'test@test.com', password: 'hashedpassword' };
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    getUserPermissions.mockResolvedValue([]);

    await loginUser({ email: 'test@test.com', password: 'password123' });

    expect(jwt.sign).toHaveBeenCalled();

    process.env.JWT_ACCESS_EXPIRY = originalAccessExpiry;
    process.env.JWT_REFRESH_EXPIRY = originalRefreshExpiry;
  });
});
