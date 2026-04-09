const { createInboundSchema, scanItemSchema, setLocationSchema } = require('../../src/validations/inbound-validation');

describe('Validation: inbound-validation', () => {
  describe('createInboundSchema', () => {
    it('should validate correct data', () => {
      const data = {
        po_number: 'PO-001',
        items: [{ sku_code: 'SKU-1', qty_target: 10 }]
      };
      const { error } = createInboundSchema.validate(data);
      expect(error).toBeUndefined();
    });
    it('should fail if items array is empty', () => {
      const { error } = createInboundSchema.validate({ po_number: 'PO-001', items: [] });
      expect(error).toBeDefined();
    });
  });

  describe('scanItemSchema', () => {
    it('should validate rfid_tag', () => {
      const { error } = scanItemSchema.validate({ rfid_tag: 'TAG123' });
      expect(error).toBeUndefined();
    });
  });

  describe('setLocationSchema', () => {
    it('should validate qr_string', () => {
      const { error } = setLocationSchema.validate({ qr_string: 'QR123' });
      expect(error).toBeUndefined();
    });
  });
});
