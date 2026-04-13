const userController = require('../../src/controllers/user');
const userService = require('../../src/services/user');
const response = require('../../src/utils/response');

jest.mock('../../src/services/user');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/response', () => ({
  success: jest.fn(data => ({ success: true, data })),
  error: jest.fn(msg => ({ success: false, message: msg }))
}));

describe('Controller: user', () => {
    let req, res, next;
    beforeEach(() => {
        req = { body: {}, params: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    ['registerUser', 'loginUser', 'getUsers', 'getUserById', 'updateUser', 'deleteUser', 'assignRole', 'refreshToken'].forEach(method => {
        it(`${method} success`, async () => {
            userService[method] = jest.fn().mockResolvedValue({});
            await userController[method](req, res, next);
            if(method === 'registerUser') expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();
        });
        it(`${method} error`, async () => {
            userService[method] = jest.fn().mockRejectedValue(new Error('fail'));
            await userController[method](req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
