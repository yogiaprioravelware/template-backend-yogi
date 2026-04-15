const { Role } = require('../../src/models');
const roleController = require('../../src/controllers/role');

const getPermissionsService = require('../../src/services/role/get-permissions-service');
const assignRolePermissionsService = require('../../src/services/role/assign-role-permissions-service');

jest.mock('../../src/models');
jest.mock('../../src/models'); // prevent sequelize loading issues
jest.mock('../../src/services/role/get-permissions-service');
jest.mock('../../src/services/role/assign-role-permissions-service');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/response', () => ({
  success: jest.fn(data => ({ success: true, data })),
  error: jest.fn(msg => ({ success: false, message: msg }))
}));

describe('Controller: role', () => {
    let req, res, next;
    beforeEach(() => {
        req = { body: {}, params: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // getRoles
    it('getRoles success', async () => {
        Role.findAll.mockResolvedValue([
            { toJSON: () => ({ id: 1, name: 'admin', permissions: [{ name: 'A' }] }) }
        ]);
        await roleController.getRoles(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
    it('getRoles success with empty permissions', async () => {
        Role.findAll.mockResolvedValue([
            { toJSON: () => ({ id: 2, name: 'guest', permissions: null }) }
        ]);
        await roleController.getRoles(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
    it('getRoles error', async () => {
        Role.findAll.mockRejectedValue(new Error('fail'));
        await roleController.getRoles(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // getPermissions
    it('getPermissions success', async () => {
        getPermissionsService.mockResolvedValue([]);
        await roleController.getPermissions(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
    it('getPermissions error', async () => {
        getPermissionsService.mockRejectedValue(new Error('fail'));
        await roleController.getPermissions(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // assignPermissions
    it('assignPermissions success', async () => {
        assignRolePermissionsService.mockResolvedValue({});
        await roleController.assignPermissions(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
    it('assignPermissions custom error status', async () => {
        const error = new Error('fail');
        error.status = 404;
        assignRolePermissionsService.mockRejectedValue(error);
        await roleController.assignPermissions(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('assignPermissions default error status', async () => {
        assignRolePermissionsService.mockRejectedValue(new Error('fail'));
        await roleController.assignPermissions(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
