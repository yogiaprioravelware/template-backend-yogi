const { createOutboundSchema, scanRfidSchema } = require('../../src/validations/outbound-validation');

describe('Validation: outbound-validation', () => {
  describe('createOutboundSchema', () => {
    it('should validate correct data', () => {
      const data = {
        order_number: 'ORD-001',
        outbound_type: 'LUNAS',
        items: [{ sku_code: 'SKU-1', qty_target: 5 }]
      };
      const { error } = createOutboundSchema.validate(data);
      expect(error).toBeUndefined();
    });
    it('should fail on invalid outbound_type', () => {
      const data = { order_number: 'ORD-001', outbound_type: 'INVALID', items: [{ sku_code: 'SKU-1', qty_target: 5 }] };
      const { error } = createOutboundSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('scanRfidSchema', () => {
    it('should validate rfid_tag', () => {
      const { error } = scanRfidSchema.validate({ rfid_tag: 'TAG123' });
      expect(error).toBeUndefined();
    });
  });
});
