const setStockOpname = require('../../../src/services/item/set-stock-opname-service');
const Item = require('../../../src/models/Item');
const Location = require('../../../src/models/Location');
const ItemLocation = require('../../../src/models/ItemLocation');
const InventoryMovement = require('../../../src/models/InventoryMovement');
const sequelize = require('../../../src/utils/database');

jest.mock('../../../src/models/Item', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.findByPk = jest.fn();
  SequelizeModel.hasMany = jest.fn();
  SequelizeModel.belongsToMany = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/Location', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.findByPk = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/ItemLocation', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.create = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/InventoryMovement', () => {
  const SequelizeModel = class {};
  SequelizeModel.create = jest.fn();
  SequelizeModel.belongsTo = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/database', () => ({
  transaction: jest.fn()
}));

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
      .rejects.toEqual({ status: 404, message: "Item not found" });
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if location not found', async () => {
    Item.findByPk.mockResolvedValue({ id: 1 });
    Location.findByPk.mockResolvedValue(null);
    await expect(setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1'))
      .rejects.toEqual({ status: 404, message: "Location not found" });
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle zero deviation correctly', async () => {
    Item.findByPk.mockResolvedValue({ id: 1, current_stock: 10 });
    Location.findByPk.mockResolvedValue({ id: 2 });
    ItemLocation.findOne.mockResolvedValue({ stock: 10 });

    const result = await setStockOpname({ item_id: 1, location_id: 2, actual_qty: 10 }, 'user1');
    expect(result.deviation).toBe(0);
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(InventoryMovement.create).not.toHaveBeenCalled();
  });

  it('should adjust stock correctly with a positive deviation', async () => {
    const mockItem = { id: 1, current_stock: 10, save: jest.fn() };
    const mockItemLoc = { stock: 10, save: jest.fn() };
    
    Item.findByPk.mockResolvedValue(mockItem);
    Location.findByPk.mockResolvedValue({ id: 2 });
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
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
});
