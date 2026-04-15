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
    it('should fail if rfid_tag is not EPC format', () => {
      const data = { rfid_tag: 'NOT-EPC-123', item_name: 'A', sku_code: 'B', category: 'C', uom: 'PCS', current_stock: 0 };
      const { error } = registerItemSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Invalid RFID format');
    });
  });

  describe('updateItemSchema', () => {
    it('should validate correct optional data', () => {
      const { error } = updateItemSchema.validate({ current_stock: 20 });
      expect(error).toBeUndefined();
    });
    it('should validate correct rfid_tag in update', () => {
      const { error } = updateItemSchema.validate({ rfid_tag: '30342509181408C000000101' });
      expect(error).toBeUndefined();
    });
    it('should fail if update rfid_tag is not EPC format', () => {
      const { error } = updateItemSchema.validate({ rfid_tag: 'INVALID' });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Invalid RFID format');
    });
  });
});
