const { registerItemSchema, updateItemSchema } = require('../../src/validations/item-validation');

describe('Validation: item-validation', () => {
  describe('registerItemSchema', () => {
    it('should validate correct data', () => {
      const data = {
        rfid_tag: '30342509181408C000000101',
        item_name: 'Test Item',
        sku_code: 'SKU123',
        category: 'Electronics',
        uom: 'PCS',
        current_stock: 10,
        location_id: 1
      };
      const { error } = registerItemSchema.validate(data);
      expect(error).toBeUndefined();
    });
    it('should fail if uom is invalid', () => {
      const data = { rfid_tag: '1', item_name: 'A', sku_code: 'B', category: 'C', uom: 'KILOGRAM', current_stock: 0 };
      const { error } = registerItemSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('updateItemSchema', () => {
    it('should validate correct optional data', () => {
      const { error } = updateItemSchema.validate({ current_stock: 20 });
      expect(error).toBeUndefined();
    });
  });
});
