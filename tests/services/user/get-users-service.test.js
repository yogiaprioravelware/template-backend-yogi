const { User } = require('../../../src/models');
const getUsers = require('../../../src/services/user/get-users-service');


jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: get-users-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all users with default pagination', async () => {
    User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await getUsers();
    expect(User.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  it('should return users with specific pagination', async () => {
    const mockUsers = [
      { id: 1, name: 'User 1', email: 'u1@test.com', created_at: new Date() },
      { id: 2, name: 'User 2', email: 'u2@test.com', created_at: new Date() }
    ];
    User.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: mockUsers
    });

    const result = await getUsers({ page: 1, limit: 10 });

    expect(result.data).toEqual(mockUsers);
    expect(result.pagination.total).toBe(2);
    expect(User.findAndCountAll).toHaveBeenCalled();
  });
});
