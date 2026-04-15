const { User } = require('../../../src/models');
const deleteUser = require('../../../src/services/user/delete-user-service');


jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: delete-user-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(deleteUser(999)).rejects.toThrow('User not found');
  });

  it('should delete user if found', async () => {
    const mockUser = {
      id: 1,
      destroy: jest.fn().mockResolvedValue(true)
    };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await deleteUser(1);

    expect(mockUser.destroy).toHaveBeenCalled();
    expect(result).toEqual({ message: "User deleted successfully" });
  });
});
