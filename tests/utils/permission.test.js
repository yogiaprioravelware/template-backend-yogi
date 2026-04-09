const PERMISSIONS = require('../../src/utils/permission');

describe('Utils: permission', () => {
  it('should have correct USER permissions defined', () => {
    expect(PERMISSIONS.USER_READ).toBe('user:read');
    expect(PERMISSIONS.USER_CREATE === undefined).toBeTruthy(); // Not defined intentionally
  });
  it('should have correct ITEM permissions defined', () => {
    expect(PERMISSIONS.ITEM_CREATE).toBe('item:create');
    expect(PERMISSIONS.ITEM_DELETE).toBe('item:delete');
  });
});
