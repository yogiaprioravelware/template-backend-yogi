const loginUser = require('../../../src/services/user/login-service');
const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getUserPermissions = require('../../../src/services/role/get-user-permissions-service');
const { loginSchema } = require('../../../src/validations/user-validation');

// Mock dependensi
jest.mock('../../../src/models/User');
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

  it('should throw an error if validation fails', async () => {
    const invalidData = { email: 'notanemail' };
    await expect(loginUser(invalidData)).rejects.toThrow();
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
      username: 'testuser',
      role: 'admin', 
      role_id: 1 
    };
    const fakePermissions = ['create:item', 'read:item'];

    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake_jwt_token');
    getUserPermissions.mockResolvedValue(fakePermissions);

    const validData = { email: 'test@test.com', password: 'password123' };
    
    const result = await loginUser(validData);

    expect(result).toEqual({
      user: {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        role: 'admin',
        role_id: 1,
        permissions: fakePermissions
      },
      token: 'fake_jwt_token'
    });
    
    expect(User.findOne).toHaveBeenCalledWith({ where: { email: validData.email } });
    expect(bcrypt.compare).toHaveBeenCalledWith(validData.password, fakeUser.password);
    expect(jwt.sign).toHaveBeenCalled();
  });
});
