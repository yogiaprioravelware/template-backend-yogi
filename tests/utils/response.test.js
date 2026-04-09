const response = require('../../src/utils/response');

describe('Utils: response', () => {
  it('should return a success object with data', () => {
    const result = response.success({ id: 1 });
    expect(result).toEqual({ success: true, data: { id: 1 } });
  });

  it('should return an error object from a string', () => {
    const result = response.error('Not found');
    expect(result).toEqual({ success: false, errors: [{ message: 'Not found' }] });
  });

  it('should return an error object from an array', () => {
    const result = response.error([{ message: 'Error 1' }]);
    expect(result).toEqual({ success: false, errors: [{ message: 'Error 1' }] });
  });

  it('should return a structured success response', () => {
    const result = response.successResponse({ id: 1 }, 'Custom success');
    expect(result).toEqual({ success: true, message: 'Custom success', data: { id: 1 } });
  });

  it('should return a structured error response', () => {
    const result = response.errorResponse(404, 'Not Found', { detail: 'Missing ID' });
    expect(result).toEqual({ success: false, statusCode: 404, message: 'Not Found', detail: 'Missing ID' });
  });
});
