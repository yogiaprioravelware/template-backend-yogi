const { isValidEPC } = require('../../src/utils/rfid-validator');

describe('Utils: rfid-validator', () => {
  it('should return true for valid SGTIN-96 EPC (24 hex, starts with 30)', () => {
    expect(isValidEPC('30342509181408C000000101')).toBe(true);
  });

  it('should return false if rfid is missing', () => {
    expect(isValidEPC(null)).toBe(false);
    expect(isValidEPC('')).toBe(false);
  });

  it('should return false if length is not 24', () => {
    expect(isValidEPC('30342509181408C00000010')).toBe(false); // 23 chars
    expect(isValidEPC('30342509181408C0000001011')).toBe(false); // 25 chars
  });

  it('should return false if contains non-hex characters', () => {
    expect(isValidEPC('30342509181408C00000010G')).toBe(false); // G is not hex
    expect(isValidEPC('30342509181408C00000010!')).toBe(false);
  });

  it('should return false if header is not 30', () => {
    expect(isValidEPC('40342509181408C000000101')).toBe(false);
    expect(isValidEPC('FF342509181408C000000101')).toBe(false);
  });
});
