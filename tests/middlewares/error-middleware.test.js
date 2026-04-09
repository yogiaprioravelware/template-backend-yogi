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
    expect(res.json).toHaveBeenCalledWith(response.error('Bad Request Data'));
  });

  it('should default to 500 and Internal Server Error if missing', () => {
    const err = {};
    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(response.error('Internal Server Error'));
  });
});
