const transferLocation = require('../../../src/services/inventory/transfer-location-service');
const { Item, Location, ItemLocation, InventoryMovement, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: {
    findByPk: jest.fn(),
  },
  Location: {
    findByPk: jest.fn(),
  },
  ItemLocation: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  InventoryMovement: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/reconciliation', () => ({
  reconcileItemStock: jest.fn()
}));

describe('Service: transfer-location-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
    jest.clearAllMocks();
  });

  it('should throw error if source and destination are the same', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 1, qty: 10 };
    await expect(transferLocation(payload)).rejects.toThrow('Source and destination locations cannot be the same');
  });

  it('should throw error if item is not found', async () => {
    const payload = { item_id: 99, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue(null);
    await expect(transferLocation(payload)).rejects.toThrow('Item not found');
  });

  it('should throw error if source location is not found', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue({ id: 1 });
    Location.findByPk.mockResolvedValueOnce(null); // fromLoc
    await expect(transferLocation(payload)).rejects.toThrow('Source location not found or inactive');
  });

  it('should throw error if dest location is not found', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue({ id: 1 });
    Location.findByPk.mockResolvedValueOnce({ id: 1, status: 'ACTIVE' }); // fromLoc
    Location.findByPk.mockResolvedValueOnce(null); // toLoc
    await expect(transferLocation(payload)).rejects.toThrow('Destination location not found or inactive');
  });

  it('should throw error if source item location not found', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue({ id: 1 });
    Location.findByPk.mockResolvedValueOnce({ id: 1, status: 'ACTIVE' }); // fromLoc
    Location.findByPk.mockResolvedValueOnce({ id: 2, status: 'ACTIVE' }); // toLoc
    ItemLocation.findOne.mockResolvedValueOnce(null);
    await expect(transferLocation(payload)).rejects.toThrow('Insufficient stock in source location');
  });

  it('should throw error if source item stock is insufficient', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue({ id: 1 });
    Location.findByPk.mockResolvedValueOnce({ id: 1, status: 'ACTIVE' }); // fromLoc
    Location.findByPk.mockResolvedValueOnce({ id: 2, status: 'ACTIVE' }); // toLoc
    ItemLocation.findOne.mockResolvedValueOnce({ stock: 5 });
    await expect(transferLocation(payload)).rejects.toThrow('Insufficient stock in source location');
  });

  it('should process transfer and create dest itemLoc if it does not exist', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue({ id: 1, sku_code: 'SKU' });
    Location.findByPk.mockResolvedValueOnce({ id: 1, status: 'ACTIVE', location_code: 'L1' }); // fromLoc
    Location.findByPk.mockResolvedValueOnce({ id: 2, status: 'ACTIVE', location_code: 'L2' }); // toLoc
    
    const mockSourceLoc = { stock: 10, save: jest.fn(), destroy: jest.fn() };
    ItemLocation.findOne
      .mockResolvedValueOnce(mockSourceLoc) // validate source
      .mockResolvedValueOnce(null); // check dest (not found)
      
    ItemLocation.create.mockResolvedValue({ stock: 10 });
    
    const result = await transferLocation(payload);
    
    expect(mockSourceLoc.stock).toBe(0);
    expect(mockSourceLoc.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(ItemLocation.create).toHaveBeenCalledWith({ item_id: 1, location_id: 2, stock: 10 }, { transaction: mockTransaction });
    expect(InventoryMovement.create).toHaveBeenCalledTimes(2);
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.message).toBe('Transfer successful');
  });

  it('should process transfer and update dest itemLoc if it exists', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    Item.findByPk.mockResolvedValue({ id: 1, sku_code: 'SKU' });
    Location.findByPk.mockResolvedValueOnce({ id: 1, status: 'ACTIVE', location_code: 'L1' }); // fromLoc
    Location.findByPk.mockResolvedValueOnce({ id: 2, status: 'ACTIVE', location_code: 'L2' }); // toLoc
    
    const mockSourceLoc = { stock: 15, save: jest.fn() };
    const mockDestLoc = { stock: 5, save: jest.fn() };
    ItemLocation.findOne
      .mockResolvedValueOnce(mockSourceLoc) // validate source
      .mockResolvedValueOnce(mockDestLoc); // check dest (found)
      
    const result = await transferLocation(payload);
    
    expect(mockSourceLoc.stock).toBe(5);
    expect(mockSourceLoc.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockDestLoc.stock).toBe(15);
    expect(mockDestLoc.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(InventoryMovement.create).toHaveBeenCalledTimes(2);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should process transfer and save source itemLoc if not empty', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 5 };
    Item.findByPk.mockResolvedValue({ id: 1, sku_code: 'SKU' });
    Location.findByPk.mockResolvedValueOnce({ id: 1, status: 'ACTIVE', location_code: 'L1' }); // fromLoc
    Location.findByPk.mockResolvedValueOnce({ id: 2, status: 'ACTIVE', location_code: 'L2' }); // toLoc
    
    const mockSourceLoc = { stock: 10, save: jest.fn(), destroy: jest.fn() };
    const mockDestLoc = { stock: 5, save: jest.fn() };
    
    ItemLocation.findOne
      .mockResolvedValueOnce(mockSourceLoc) // validate source
      .mockResolvedValueOnce(mockDestLoc); // check dest (found)
      
    await transferLocation(payload);
    
    expect(mockSourceLoc.stock).toBe(5);
    expect(mockSourceLoc.save).toHaveBeenCalled();
    expect(mockDestLoc.stock).toBe(10);
    expect(mockDestLoc.save).toHaveBeenCalled();
  });

  it('should handle transaction error in transferLocation', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    sequelize.transaction.mockRejectedValueOnce(new Error('TRF_ERR'));
    await expect(transferLocation(payload)).rejects.toThrow('TRF_ERR');
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    const payload = { item_id: 1, from_location_id: 1, to_location_id: 2, qty: 10 };
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Item.findByPk.mockRejectedValueOnce(new Error('No transaction object'));

    await expect(transferLocation(payload)).rejects.toThrow('No transaction object');
  });
});
