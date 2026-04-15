const { createInboundSchema, scanRfidReceivedSchema, scanQrStoredSchema } = require('../../src/validations/inbound-validation');

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

  describe('scanRfidReceivedSchema', () => {
    it('should validate rfid_tag', () => {
      const { error } = scanRfidReceivedSchema.validate({ rfid_tag: '30342509181408C000000101', location_id: 1 });
      expect(error).toBeUndefined();
    });
    it('should fail if rfid_tag is not EPC format', () => {
      const { error } = scanRfidReceivedSchema.validate({ rfid_tag: 'INVALID', location_id: 1 });
      expect(error).toBeDefined();
    });
  });

  describe('scanQrStoredSchema', () => {
    it('should validate qr_string', () => {
      const { error } = scanQrStoredSchema.validate({ qr_string: 'QR123', rfid_tag: '30342509181408C000000101' });
      expect(error).toBeUndefined();
    });
    it('should fail if rfid_tag is not EPC format', () => {
      const { error } = scanQrStoredSchema.validate({ qr_string: 'QR123', rfid_tag: 'INVALID' });
      expect(error).toBeDefined();
    });
  });
});
