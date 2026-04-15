const getPermissions = require('../../../src/services/role/get-permissions-service');
const { Permission } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Permission: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: get-permissions-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a grouped object of permissions', async () => {
    const mockPermissions = [
      { id: 1, name: 'user:read', module: 'User', action: 'read', description: 'Read User' },
      { id: 2, name: 'user:create', module: 'User', action: 'create', description: 'Create User' },
      { id: 3, name: 'item:read', module: 'Item', action: 'read', description: 'Read Item' }
    ];
    Permission.findAll.mockResolvedValue(mockPermissions);

    const result = await getPermissions();

    expect(result).toEqual({
      User: [
        { id: 1, name: 'user:read', action: 'read', description: 'Read User' },
        { id: 2, name: 'user:create', action: 'create', description: 'Create User' }
      ],
      Item: [
        { id: 3, name: 'item:read', action: 'read', description: 'Read Item' }
      ]
    });
  });

  it('should throw error on DB failure', async () => {
    Permission.findAll.mockRejectedValue(new Error('DB failure'));
    await expect(getPermissions()).rejects.toThrow('DB failure');
  });
});
