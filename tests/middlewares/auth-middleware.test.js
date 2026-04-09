const authMiddleware = require('../../src/middlewares/auth-middleware');
const response = require('../../src/utils/response');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Middleware: authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization header is missing', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(response.error('Authentication invalid'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token structure is invalid (not starting with Bearer)', () => {
    req.headers.authorization = 'Basic token123';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(response.error('Authentication invalid'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if jwt verification fails', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(response.error('Authentication invalid'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken';
    const payload = { id: 1, role: 'admin', role_id: 1 };
    jwt.verify.mockReturnValue(payload);

    authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: 1, role: 'admin', role_id: 1 });
    expect(next).toHaveBeenCalled();
  });
});
