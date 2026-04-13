const { transferLocationSchema } = require('../../src/validations/inventory-validation');

describe('Validation: inventory-validation', () => {
  describe('transferLocationSchema', () => {
    it('should validate valid payload', () => {
      const { error } = transferLocationSchema.validate({
        item_id: 1,
        from_location_id: 1,
        to_location_id: 2,
        qty: 10
      });
      expect(error).toBeUndefined();
    });

    it('should invalidate missing item_id', () => {
      const { error } = transferLocationSchema.validate({
        from_location_id: 1,
        to_location_id: 2,
        qty: 10
      });
      expect(error.message).toMatch(/"item_id" is required/);
    });
  });
});
