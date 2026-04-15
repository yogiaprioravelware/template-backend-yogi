const { User } = require('../../../src/models');
const getUserById = require('../../../src/services/user/get-user-by-id-service');


jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: get-user-by-id-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(getUserById(999)).rejects.toThrow('User not found');
  });

  it('should return user if found', async () => {
    const mockUser = { id: 1, name: 'Test' };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await getUserById(1);

    expect(result).toEqual(mockUser);
    expect(User.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
