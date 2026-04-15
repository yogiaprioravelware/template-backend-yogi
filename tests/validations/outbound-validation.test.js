const { createOutboundSchema, scanQrPickingSchema, scanRfidStagingSchema } = require('../../src/validations/outbound-validation');

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

  describe('scanQrPickingSchema', () => {
    it('should validate rfid_tag and qr_string', () => {
      const { error } = scanQrPickingSchema.validate({ rfid_tag: '30342509181408C000000101', qr_string: 'QR123' });
      expect(error).toBeUndefined();
    });
    it('should fail if rfid_tag is not EPC format', () => {
      const { error } = scanQrPickingSchema.validate({ rfid_tag: 'INVALID', qr_string: 'QR123' });
      expect(error).toBeDefined();
    });
  });

  describe('scanRfidStagingSchema', () => {
    it('should validate rfid_tag', () => {
      const { error } = scanRfidStagingSchema.validate({ rfid_tag: '30342509181408C000000101' });
      expect(error).toBeUndefined();
    });
    it('should fail if rfid_tag is not EPC format', () => {
      const { error } = scanRfidStagingSchema.validate({ rfid_tag: 'INVALID' });
      expect(error).toBeDefined();
    });
  });
});
