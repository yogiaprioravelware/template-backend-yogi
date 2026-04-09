const getUsers = require('../../../src/services/user/get-users-service');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: get-users-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all users', async () => {
    const mockUsers = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ];
    User.findAll.mockResolvedValue(mockUsers);

    const result = await getUsers();

    expect(result).toEqual(mockUsers);
    expect(User.findAll).toHaveBeenCalledWith({
      attributes: ["id", "name", "email", "role", "created_at"]
    });
  });
});
