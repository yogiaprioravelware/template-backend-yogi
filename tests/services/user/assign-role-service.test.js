const assignRole = require('../../../src/services/user/assign-role-service');
const { User } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: assign-role-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
      email: 'test@test.com',
      update: jest.fn().mockImplementation(function(data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      })
    };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await assignRole(1, validData);

    expect(mockUser.update).toHaveBeenCalledWith(validData);
    expect(result.message).toBe('User role updated successfully');
    expect(result.user).toEqual({
      id: 1,
      email: 'test@test.com',
      role_id: 2
    });
  });
});
