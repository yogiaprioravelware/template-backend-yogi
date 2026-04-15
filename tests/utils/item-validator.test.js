const { Item } = require('../../src/models');
const { validateSkusExist } = require('../../src/utils/item-validator');

const logger = require('../../src/utils/logger');

jest.mock('../../src/models');
jest.mock('../../src/utils/logger');

describe('Util: item-validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate all SKUs exist', async () => {
    const items = [
      { sku_code: 'SKU-1' },
      { sku_code: 'SKU-2' },
      { sku_code: 'SKU-1' } // Duplicate to test Set
    ];
    
    Item.findAll.mockResolvedValue([
      { sku_code: 'SKU-1' },
      { sku_code: 'SKU-2' }
    ]);

    await expect(validateSkusExist(items)).resolves.not.toThrow();
  });

  it('should throw error if any SKU is missing', async () => {
    const items = [
      { sku_code: 'SKU-1' },
      { sku_code: 'SKU-MISSING' }
    ];
    
    Item.findAll.mockResolvedValue([
      { sku_code: 'SKU-1' }
    ]);

    await expect(validateSkusExist(items)).rejects.toThrow(/not found: SKU-MISSING/);
    expect(logger.warn).toHaveBeenCalled();
  });
});
