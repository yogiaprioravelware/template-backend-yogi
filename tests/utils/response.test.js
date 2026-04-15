const response = require('../../src/utils/response');

describe('Utils: response', () => {
  it('should return a success object with data', () => {
    const result = response.success({ id: 1 });
    expect(result).toEqual({ 
      success: true, 
      message: 'Operation successful',
      data: { id: 1 } 
    });
  });

  it('should return a success object with custom message', () => {
    const result = response.success({ id: 1 }, 'Custom success');
    expect(result).toEqual({ 
      success: true, 
      message: 'Custom success',
      data: { id: 1 } 
    });
  });

  it('should return an error object from a string message', () => {
    const result = response.error('Not found');
    expect(result).toEqual({ 
      success: false, 
      message: 'Not found',
      errors: [],
      statusCode: 500
    });
  });

  it('should return an error object with custom status and details', () => {
    const result = response.error('Validation failed', { field: 'email' }, 400);
    expect(result).toEqual({ 
      success: false, 
      message: 'Validation failed',
      errors: [{ field: 'email' }],
      statusCode: 400
    });
  });

  it('should handle array as error details', () => {
    const result = response.error('Multi errors', [{ msg: 'err1' }, { msg: 'err2' }]);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].msg).toBe('err1');
  });

  it('should return errorResponse alias with correct parameter order', () => {
    const result = response.errorResponse(400, 'Bad Request', { field: 'email' });
    expect(result).toEqual({
      success: false,
      message: 'Bad Request',
      errors: [{ field: 'email' }],
      statusCode: 400
    });
  });

  it('should return successResponse alias', () => {
    const result = response.successResponse({ id: 1 }, 'Created');
    expect(result).toEqual({
      success: true,
      message: 'Created',
      data: { id: 1 }
    });
  });

  it('should handle non-array details in error function', () => {
    const result = response.error('Single error', { field: 'name' });
    expect(result.errors).toEqual([{ field: 'name' }]);
  });

  it('should handle null details in error function', () => {
    const result = response.error('Null details');
    expect(result.errors).toEqual([]);
  });

  it('should use default error message and status when called without args', () => {
    const result = response.error();
    expect(result).toEqual({
      success: false,
      message: 'An error occurred',
      errors: [],
      statusCode: 500
    });
  });
});
