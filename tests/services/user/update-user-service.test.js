const updateUser = require('../../../src/services/user/update-user-service');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: update-user-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error on invalid data', async () => {
    const invalidData = { email: 'invalid_email' };
    await expect(updateUser(1, invalidData)).rejects.toThrow();
  });

  it('should throw error if user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    const validData = { name: 'New Name' };
    await expect(updateUser(999, validData)).rejects.toThrow('User not found');
  });

  it('should update user if found', async () => {
    const validData = { name: 'Updated Name' };
    const mockUser = {
      id: 1,
      update: jest.fn().mockResolvedValue(true)
    };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await updateUser(1, validData);

    expect(mockUser.update).toHaveBeenCalledWith(validData);
    expect(result).toEqual(mockUser);
  });
});
