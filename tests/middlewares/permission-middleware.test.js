const authorize = require('../../src/middlewares/permission-middleware');
const checkUserPermission = require('../../src/services/role/check-user-permission-service');
const response = require('../../src/utils/response');

jest.mock('../../src/services/role/check-user-permission-service');
jest.mock('../../src/utils/logger'); // Silences logs

describe('Middleware: permission-middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if req.user is undefined', async () => {
    const middleware = authorize('user:read');
    await middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(response.error("Unauthorized"));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user does not have permission', async () => {
    req.user = { id: 1, role_id: 2 };
    checkUserPermission.mockResolvedValue(false);

    const middleware = authorize('item:create');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if user has permission', async () => {
    req.user = { id: 1, role_id: 1 };
    checkUserPermission.mockResolvedValue(true);

    const middleware = authorize('item:create');
    await middleware(req, res, next);

    expect(checkUserPermission).toHaveBeenCalledWith(req.user, 'item:create');
    expect(next).toHaveBeenCalled();
  });

  it('should return 500 if an internal error occurs', async () => {
    req.user = { id: 1 };
    checkUserPermission.mockRejectedValue(new Error('DB connection failed'));

    const middleware = authorize('item:create');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(response.error("Internal Server Error"));
  });
});
