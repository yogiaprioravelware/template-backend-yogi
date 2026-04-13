/**
 * RFID Validator Utility (EPC SGTIN-96)
 * Standard: GS1 EPC Tag Data Standard
 * Format: 24 Hexadecimal characters (96 bits)
 * Common Header for SGTIN-96: 0x30
 */

const isValidEPC = (rfid) => {
  if (!rfid) return false;
  
  // 1. Must be exactly 24 characters
  if (rfid.length !== 24) return false;
  
  // 2. Must be Hexadecimal only
  const hexRegex = /^[0-9A-Fa-f]{24}$/;
  if (!hexRegex.test(rfid)) return false;
  
  // 3. Header check: SGTIN-96 starts with binary 0011 0000 (hex 30)
  // Note: Some legacy/custom tags might use different headers, 
  // but for Enterprise WMS we adhere to GS1/SGTIN-96.
  if (!rfid.startsWith('30')) return false;
  
  return true;
};

module.exports = {
  isValidEPC
};
