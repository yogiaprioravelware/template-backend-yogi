const { scanQrStored } = require('../../../src/services/inbound/scan-qr-stored-service');
const { Item, Location, InboundLog, ItemLocation, InventoryMovement, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: {
    findOne: jest.fn(),
  },
  Location: {
    findOne: jest.fn(),
  },
  InboundLog: {
    findOne: jest.fn(),
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

describe('Service: scan-qr-stored-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if location QR code not found', async () => {
    Location.findOne.mockResolvedValue(null);
    await expect(scanQrStored('QR1', 'RFID1', 100))
      .rejects.toThrow("Location QR code not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if location is inactive', async () => {
    Location.findOne.mockResolvedValue({ id: 1, status: 'INACTIVE' });
    await expect(scanQrStored('QR1', 'RFID1', 100))
      .rejects.toThrow("Location is inactive for storage");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if RFID tag not found in system', async () => {
    Location.findOne.mockResolvedValue({ id: 1, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue(null);
    await expect(scanQrStored('QR1', 'RFID1', 100))
      .rejects.toThrow("RFID tag not found in system");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if item has not been received or is already stored', async () => {
    Location.findOne.mockResolvedValue({ id: 1, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundLog.findOne.mockResolvedValue(null);
    await expect(scanQrStored('QR1', 'RFID1', 100))
      .rejects.toThrow("Item has not been received or is already stored.");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should successfully store item and update existing item location stock', async () => {
    const mockInboundLog = { id: 30, status: 'RECEIVED', save: jest.fn() };
    const mockItemLoc = { id: 40, stock: 5, save: jest.fn() };
    Location.findOne.mockResolvedValue({ id: 1, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundLog.findOne.mockResolvedValue(mockInboundLog);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    const result = await scanQrStored('QR1', 'RFID1', 100);

    expect(mockInboundLog.status).toBe('STORED');
    expect(mockInboundLog.save).toHaveBeenCalled();
    expect(mockItemLoc.stock).toBe(6);
    expect(mockItemLoc.save).toHaveBeenCalled();
    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      operator_name: 'USER_100'
    }), expect.anything());
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.status).toBe('STORED');
  });

  it('should successfully store item and use SYSTEM as operator if userId is null', async () => {
    const mockInboundLog = { id: 30, status: 'RECEIVED', save: jest.fn() };
    const mockItemLoc = { id: 40, stock: 5, save: jest.fn() };
    Location.findOne.mockResolvedValue({ id: 1, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundLog.findOne.mockResolvedValue(mockInboundLog);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    await scanQrStored('QR1', 'RFID1', null);

    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      operator_name: 'SYSTEM'
    }), expect.anything());
  });

  it('should rollback transaction on error', async () => {
    Location.findOne.mockRejectedValue(new Error('DB Error'));
    await expect(scanQrStored('QR1', 'RFID1', 100)).rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle error when transaction creation fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction Fail'));
    await expect(scanQrStored('QR1', 'RFID1', 100)).rejects.toThrow('Transaction Fail');
  });

  it('should successfully store item and create new item location if missing', async () => {
    const mockInboundLog = { id: 30, status: 'RECEIVED', save: jest.fn() };
    Location.findOne.mockResolvedValue({ id: 1, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundLog.findOne.mockResolvedValue(mockInboundLog);
    ItemLocation.findOne.mockResolvedValue(null);
    ItemLocation.create.mockResolvedValue({ id: 40, stock: 1 });

    const result = await scanQrStored('QR1', 'RFID1', 100);

    expect(mockInboundLog.status).toBe('STORED');
    expect(ItemLocation.create).toHaveBeenCalledWith(expect.objectContaining({ stock: 1 }), expect.anything());
    expect(InventoryMovement.create).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.status).toBe('STORED');
  });
});