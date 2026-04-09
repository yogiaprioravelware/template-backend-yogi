const getUserPermissions = require('../../../src/services/role/get-user-permissions-service');
const Role = require('../../../src/models/Role');
const Permission = require('../../../src/models/Permission');

jest.mock('../../../src/models/Role');
jest.mock('../../../src/models/Permission');
jest.mock('../../../src/utils/logger');

describe('Service: get-user-permissions-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array if user is missing role_id', async () => {
    const result = await getUserPermissions({ id: 1 });
    expect(result).toEqual([]);
  });

  it('should return all permission names if user is admin', async () => {
    Permission.findAll.mockResolvedValue([{ name: 'perm1' }, { name: 'perm2' }]);
    const result = await getUserPermissions({ role: 'admin' });
    expect(result).toEqual(['perm1', 'perm2']);
  });

  it('should return mapped permissions for specific role', async () => {
    const mockRole = {
      Permissions: [{ name: 'item:read' }]
    };
    Role.findByPk.mockResolvedValue(mockRole);
    
    const result = await getUserPermissions({ role_id: 2 });
    expect(result).toEqual(['item:read']);
  });

  it('should return empty array if an error occurs', async () => {
    Role.findByPk.mockRejectedValue(new Error('DB Failed'));
    const result = await getUserPermissions({ role_id: 2 });
    expect(result).toEqual([]);
  });

  it('should return empty array if role is not found in DB', async () => {
    Role.findByPk.mockResolvedValue(null);
    const result = await getUserPermissions({ role_id: 2 });
    expect(result).toEqual([]);
  });

  it('should return empty array if user object is completely null or missing', async () => {
    const result = await getUserPermissions(null);
    expect(result).toEqual([]);
  });
});
