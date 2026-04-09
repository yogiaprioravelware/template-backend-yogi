const assignRolePermissions = require('../../../src/services/role/assign-role-permissions-service');
const Role = require('../../../src/models/Role');
const RolePermission = require('../../../src/models/RolePermission');
const sequelize = require('../../../src/utils/database');

jest.mock('../../../src/models/Role', () => ({ findByPk: jest.fn() }));
jest.mock('../../../src/models/RolePermission', () => ({ destroy: jest.fn(), bulkCreate: jest.fn() }));
jest.mock('../../../src/utils/logger');

// Mock Sequelize Transaction
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};
jest.mock('../../../src/utils/database', () => ({
  transaction: jest.fn(),
  define: jest.fn()
}));

describe('Service: assign-role-permissions-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  it('should throw error if role is not found', async () => {
    Role.findByPk.mockResolvedValue(null);
    await expect(assignRolePermissions(999, [1])).rejects.toThrow('Role not found');
  });

  it('should clear old permissions and insert new ones successfully', async () => {
    Role.findByPk.mockResolvedValue({ id: 1, name: 'admin' });
    RolePermission.destroy.mockResolvedValue(true);
    RolePermission.bulkCreate.mockResolvedValue(true);

    const result = await assignRolePermissions(1, [1, 2]);

    expect(RolePermission.destroy).toHaveBeenCalledWith({ where: { role_id: 1 }, transaction: mockTransaction });
    expect(RolePermission.bulkCreate).toHaveBeenCalledWith([
      { role_id: 1, permission_id: 1 },
      { role_id: 1, permission_id: 2 }
    ], { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual({ success: true, roleId: 1, count: 2 });
  });

  it('should rollback transaction on error', async () => {
    Role.findByPk.mockResolvedValue({ id: 1, name: 'admin' });
    RolePermission.destroy.mockRejectedValue(new Error('DB Error'));

    await expect(assignRolePermissions(1, [1])).rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should skip inserting new permissions if permissionIds is empty', async () => {
    Role.findByPk.mockResolvedValue({ id: 1, name: 'admin' });
    RolePermission.destroy.mockResolvedValue(true);

    const result = await assignRolePermissions(1, []);

    expect(RolePermission.bulkCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, roleId: 1, count: 0 });
  });

  it('should skip inserting new permissions if permissionIds is undefined', async () => {
    Role.findByPk.mockResolvedValue({ id: 1, name: 'admin' });
    RolePermission.destroy.mockResolvedValue(true);

    const result = await assignRolePermissions(1); // not passing permissionIds

    expect(RolePermission.bulkCreate).not.toHaveBeenCalled();
    // Default is undefined, so length is not evaluated
    expect(result.success).toBe(true);
  });
});
