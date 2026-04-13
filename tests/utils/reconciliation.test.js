const { reconcileItemStock } = require('../../src/utils/reconciliation');
const Item = require('../../src/models/Item');
const ItemLocation = require('../../src/models/ItemLocation');
const logger = require('../../src/utils/logger');

jest.mock('../../src/models/Item', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../src/models/ItemLocation', () => ({
  sum: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Util: reconciliation', () => {
  const mockTransaction = {};

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully reconcile stock when locations exist', async () => {
    ItemLocation.sum.mockResolvedValue(150);
    const mockItem = { 
      id: 1, 
      sku_code: 'SKU1', 
      current_stock: 100, 
      save: jest.fn() 
    };
    Item.findByPk.mockResolvedValue(mockItem);

    const result = await reconcileItemStock(1, mockTransaction);

    expect(result).toBe(150);
    expect(mockItem.current_stock).toBe(150);
    expect(mockItem.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Stock drift detected'));
  });

  it('should reconcile stock to 0 if no locations found', async () => {
    ItemLocation.sum.mockResolvedValue(null);
    const mockItem = { 
      id: 1, 
      sku_code: 'SKU1', 
      current_stock: 5, 
      save: jest.fn() 
    };
    Item.findByPk.mockResolvedValue(mockItem);

    const result = await reconcileItemStock(1, mockTransaction);

    expect(result).toBe(0);
    expect(mockItem.current_stock).toBe(0);
  });

  it('should only log info if stock is already in sync', async () => {
    ItemLocation.sum.mockResolvedValue(100);
    const mockItem = { 
      id: 1, 
      sku_code: 'SKU1', 
      current_stock: 100, 
      save: jest.fn() 
    };
    Item.findByPk.mockResolvedValue(mockItem);

    await reconcileItemStock(1, mockTransaction);

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('already in sync'));
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should do nothing if item is not found', async () => {
    ItemLocation.sum.mockResolvedValue(100);
    Item.findByPk.mockResolvedValue(null);

    const result = await reconcileItemStock(1, mockTransaction);

    expect(result).toBe(100);
    expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('in sync'));
  });

  it('should log error and throw if an exception occurs', async () => {
    ItemLocation.sum.mockRejectedValue(new Error('DB Error'));

    await expect(reconcileItemStock(1, mockTransaction)).rejects.toThrow('DB Error');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Reconciliation failed'));
  });
});
