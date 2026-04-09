const { createLocationSchema, updateLocationSchema } = require('../../src/validations/location-validation');

describe('Validation: location-validation', () => {
  describe('createLocationSchema', () => {
    it('should validate correct data', () => {
      const data = {
        location_code: 'LOC-1',
        qr_string: 'QR-LOC-1',
        warehouse: 'WH-1',
        rack: 'R1',
        bin: 'B1'
      };
      const { error } = createLocationSchema.validate(data);
      expect(error).toBeUndefined();
    });
    it('should fail if required fields are missing', () => {
      const { error } = createLocationSchema.validate({ location_code: 'LOC-1' });
      expect(error).toBeDefined();
    });
  });

  describe('updateLocationSchema', () => {
    it('should validate correct status', () => {
      const { error } = updateLocationSchema.validate({ status: 'ACTIVE' });
      expect(error).toBeUndefined();
    });
    it('should fail if status is invalid', () => {
      const { error } = updateLocationSchema.validate({ status: 'PENDING' });
      expect(error).toBeDefined();
    });
  });
});
