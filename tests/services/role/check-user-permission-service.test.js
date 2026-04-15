const checkUserPermission = require('../../../src/services/role/check-user-permission-service');
const { Role, Permission } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Role: {
    findByPk: jest.fn(),
  },
  Permission: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: check-user-permission-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if user is missing', async () => {
    const result = await checkUserPermission(null, 'item:read');
    expect(result).toBe(false);
  });

  it('should return true if user is admin', async () => {
    const result = await checkUserPermission({ role: 'admin' }, 'anything');
    expect(result).toBe(true);
  });

  it('should return true if role contains required permission', async () => {
    Role.findByPk.mockResolvedValue({ id: 2, name: 'operator' });
    const result = await checkUserPermission({ role_id: 2, role: 'operator' }, 'item:read');
    expect(result).toBe(true);
  });

  it('should return false if role does not contain permission', async () => {
    Role.findByPk.mockResolvedValue(null);
    const result = await checkUserPermission({ role_id: 3, role: 'viewer' }, 'item:read');
    expect(result).toBe(false);
  });

  it('should return false if an error occurs', async () => {
    Role.findByPk.mockRejectedValue(new Error('DB failure'));
    const result = await checkUserPermission({ role_id: 2, role: 'operator' }, 'item:read');
    expect(result).toBe(false);
  });
});
