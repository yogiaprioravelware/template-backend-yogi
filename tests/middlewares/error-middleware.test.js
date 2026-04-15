const errorMiddleware = require('../../src/middlewares/error-middleware');
const response = require('../../src/utils/response');

jest.mock('../../src/utils/logger'); // Prevent actual logging during tests

describe('Middleware: error-middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should handle error with custom status and message', () => {
    const err = { status: 400, message: 'Bad Request Data' };
    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(response.error('Bad Request Data', null, 400));
  });

  it('should default to 500 and Internal Server Error if missing', () => {
    const err = {};
    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(response.error('Internal Server Error', null, 500));
  });

  it('should handle SequelizeUniqueConstraintError', () => {
    const err = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ path: 'email', message: 'email must be unique' }]
    };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Data already exists' }));
  });

  it('should handle SequelizeValidationError', () => {
    const err = {
      name: 'SequelizeValidationError',
      errors: [{ path: 'name', message: 'name is required' }]
    };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Data validation failed' }));
  });

  it('should handle SequelizeDatabaseError in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const err = {
      name: 'SequelizeDatabaseError',
      message: 'Table not found'
    };
    errorMiddleware(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: ['Table not found'] }));
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle SequelizeDatabaseError in non-development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = {
      name: 'SequelizeDatabaseError',
      message: 'Table not found'
    };
    errorMiddleware(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Database operation failed' }));
    const jsonOutput = res.json.mock.calls[0][0];
    expect(jsonOutput.errors).toEqual([]);
    process.env.NODE_ENV = originalEnv;
  });
});
