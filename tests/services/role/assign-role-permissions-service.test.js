const assignRolePermissions = require('../../../src/services/role/assign-role-permissions-service');
const { Role, RolePermission, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Role: {
    findByPk: jest.fn(),
  },
  RolePermission: {
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: assign-role-permissions-service', () => {
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

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
    expect(result).toEqual({ 
      message: "Role permissions updated successfully", 
      roleId: 1, 
      count: 2 
    });
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

    expect(RolePermission.destroy).toHaveBeenCalledWith(expect.objectContaining({
      where: { role_id: 1 }
    }));
    expect(RolePermission.bulkCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ 
      message: "Role permissions updated successfully", 
      roleId: 1, 
      count: 0 
    });
  });

  it('should skip inserting new permissions if permissionIds is undefined', async () => {
    Role.findByPk.mockResolvedValue({ id: 1, name: 'admin' });
    
    const result = await assignRolePermissions(1, undefined);

    expect(RolePermission.bulkCreate).not.toHaveBeenCalled();
    expect(result.message).toBe("Role permissions updated successfully");
  });
});
