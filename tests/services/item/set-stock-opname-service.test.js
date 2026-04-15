const setStockOpname = require('../../../src/services/item/set-stock-opname-service');
const { Item, Location, ItemLocation, InventoryMovement, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Location: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  ItemLocation: {
    findOne: jest.fn(),
    create: jest.fn(),
    sum: jest.fn(),
  },
  InventoryMovement: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: set-stock-opname-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if item not found', async () => {
    Item.findByPk.mockResolvedValue(null);
    await expect(setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1'))
      .rejects.toThrow("Item not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if location not found', async () => {
    Item.findByPk.mockResolvedValue({ id: 1 });
    Location.findByPk.mockResolvedValue(null);
    await expect(setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1'))
      .rejects.toThrow("Location not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle zero deviation correctly', async () => {
    const mockItem = { id: 1, current_stock: 10, save: jest.fn() };
    Item.findByPk.mockResolvedValue(mockItem);
    Location.findByPk.mockResolvedValue({ id: 2 });
    const mockItemLoc = { stock: 10, save: jest.fn() };
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    ItemLocation.sum.mockResolvedValue(10);

    const result = await setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1');
    expect(result.deviation).toBe(0);
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      qty_change: 0,
      type: 'STOCK_OPNAME'
    }), expect.anything());
  });

  it('should adjust stock correctly with a positive deviation', async () => {
    const mockItem = { id: 1, current_stock: 10, save: jest.fn() };
    const mockItemLoc = { stock: 10, save: jest.fn() };
    
    Item.findByPk.mockResolvedValue(mockItem);
    Location.findByPk.mockResolvedValue({ id: 2 });
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    ItemLocation.sum.mockResolvedValue(15);
    InventoryMovement.create.mockResolvedValue({});

    const result = await setStockOpname({ item_id: 1, location_id: 2, actual_qty: 15, notes: 'Found 5 more' }, 'user1');
    
    expect(mockItemLoc.stock).toBe(15);
    expect(mockItemLoc.save).toHaveBeenCalled();
    expect(mockItem.current_stock).toBe(15); // 10 original + 5 diff
    expect(mockItem.save).toHaveBeenCalled();
    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'STOCK_OPNAME',
      qty_change: 5,
      balance_after: 15,
      operator_name: 'user1'
    }), { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.deviation).toBe(5);
  });

  it('should adjust stock correctly with a negative deviation (create location if missing)', async () => {
    const mockItem = { id: 1, current_stock: 10, save: jest.fn() };
    const mockCreatedItemLoc = { stock: 0, save: jest.fn() };
    
    Item.findByPk.mockResolvedValue(mockItem);
    Location.findByPk.mockResolvedValue({ id: 2 });
    ItemLocation.findOne.mockResolvedValue(null);
    ItemLocation.create.mockResolvedValue(mockCreatedItemLoc);
    ItemLocation.sum.mockResolvedValue(8);
    InventoryMovement.create.mockResolvedValue({});

    const result = await setStockOpname({ item_id: 1, location_id: 2, actual_qty: -2 }, null); // user null
    
    expect(mockCreatedItemLoc.stock).toBe(-2);
    expect(mockCreatedItemLoc.save).toHaveBeenCalled();
    expect(mockItem.current_stock).toBe(8); // 10 original + (-2 diff)
    expect(mockItem.save).toHaveBeenCalled();
    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'STOCK_OPNAME',
      qty_change: -2,
      operator_name: 'SYSTEM'
    }), { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should handle transaction error in setStockOpname', async () => {
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction fail'));
    await expect(setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1')).rejects.toThrow('Transaction fail');
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Item.findByPk.mockRejectedValueOnce(new Error('Opname failed without tx'));

    await expect(setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1'))
      .rejects.toThrow('Opname failed without tx');
  });
});
