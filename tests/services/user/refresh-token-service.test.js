const { User } = require('../../../src/models');
const refreshTokenService = require('../../../src/services/user/refresh-token-service');

const jwt = require('jsonwebtoken');

jest.mock('../../../src/models');
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/logger');

describe('Service: refreshToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'access_secret';
    process.env.JWT_REFRESH_SECRET = 'refresh_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw 400 if token is missing', async () => {
    await expect(refreshTokenService(null)).rejects.toThrow('Refresh token is required');
  });

  it('should return a new access token on successful refresh', async () => {
    const fakePayload = { id: 1 };
    const fakeUser = { id: 1, username: 'testuser', role: 'admin', role_id: 1 };
    
    jwt.verify.mockReturnValue(fakePayload);
    User.findByPk.mockResolvedValue(fakeUser);
    jwt.sign.mockReturnValue('new_access_token');

    const result = await refreshTokenService('valid_refresh_token');

    expect(result).toEqual({ accessToken: 'new_access_token' });
    expect(jwt.verify).toHaveBeenCalledWith('valid_refresh_token', 'refresh_secret');
    expect(User.findByPk).toHaveBeenCalledWith(1);
  });

  it('should throw 401 if user is not found', async () => {
    jwt.verify.mockReturnValue({ id: 999 });
    User.findByPk.mockResolvedValue(null);

    await expect(refreshTokenService('valid_token_but_no_user')).rejects.toThrow('User not found');
  });

  it('should throw 401 if token is invalid or expired', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(refreshTokenService('expired_token')).rejects.toThrow('Invalid refresh token');
  });

  it('should use default expiry if env variable is missing (branch coverage)', async () => {
    const originalExpiry = process.env.JWT_ACCESS_EXPIRY;
    delete process.env.JWT_ACCESS_EXPIRY;

    jwt.verify.mockReturnValue({ id: 1 });
    User.findByPk.mockResolvedValue({ id: 1 });
    jwt.sign.mockReturnValue('token');

    await refreshTokenService('token');
    expect(jwt.sign).toHaveBeenCalled();

    process.env.JWT_ACCESS_EXPIRY = originalExpiry;
  });
});
