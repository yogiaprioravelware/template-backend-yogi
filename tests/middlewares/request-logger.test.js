const requestLogger = require('../../src/middlewares/request-logger');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/logger');

describe('Middleware: request-logger', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/api/test' };
    res = {
      statusCode: 200,
      on: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next and register finish handler on res', () => {
    requestLogger(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    
    // Simulate 'finish' event
    const finishCallback = res.on.mock.calls[0][1];
    finishCallback();
    
    expect(logger.http).toHaveBeenCalled();
  });
});
