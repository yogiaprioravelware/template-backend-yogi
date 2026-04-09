const assignRole = require('../../../src/services/user/assign-role-service');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: assign-role-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error on invalid data', async () => {
    const invalidData = { role_id: 'notanumber' };
    await expect(assignRole(1, invalidData)).rejects.toThrow();
  });

  it('should throw error if user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    const validData = { role_id: 2 };
    await expect(assignRole(999, validData)).rejects.toThrow('User not found');
  });

  it('should update user role if found', async () => {
    const validData = { role_id: 2 };
    const mockUser = {
      id: 1,
      update: jest.fn().mockResolvedValue(true)
    };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await assignRole(1, validData);

    expect(mockUser.update).toHaveBeenCalledWith(validData);
    expect(result.message).toBe('User role updated successfully');
    expect(result.user).toEqual(mockUser);
  });
});
