const { scanRfidReceived } = require('../../../src/services/inbound/scan-rfid-received-service');
const { Item, Inbound, InboundItem, Location, InboundLog, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: {
    findOne: jest.fn(),
  },
  Inbound: {
    findByPk: jest.fn(),
  },
  InboundItem: {
    findOne: jest.fn(),
  },
  Location: {
    findByPk: jest.fn(),
  },
  InboundLog: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: scan-rfid-received-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if inbound PO not found', async () => {
    Inbound.findByPk.mockResolvedValue(null);
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("Inbound PO not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if inbound PO is already completed', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'DONE' });
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("Inbound PO is already completed");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if RFID tag not found in system', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Item.findOne.mockResolvedValue(null);
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("RFID tag not found in system");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if SKU is not in this PO', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue(null);
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("SKU SKU1 is not in this PO");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if RFID has already been received/stored', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue({ id: 20, qty_received: 0, qty_target: 10 });
    InboundLog.findOne.mockResolvedValue({ id: 30 });
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("Item with this RFID has already been received/stored");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if target quantity already completed', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue({ id: 20, qty_received: 10, qty_target: 10 });
    InboundLog.findOne.mockResolvedValue(null);
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("Item target quantity already completed");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    Inbound.findByPk.mockRejectedValue(new Error('DB Error'));
    await expect(scanRfidReceived(1, 'RFID1', 10, 100)).rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if location not found', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue({ id: 20, qty_received: 5, qty_target: 10 });
    InboundLog.findOne.mockResolvedValue(null);
    Location.findByPk.mockResolvedValue(null);
    await expect(scanRfidReceived(1, 'RFID1', 10, 100))
      .rejects.toThrow("Location not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle error when transaction creation fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction Fail'));
    await expect(scanRfidReceived(1, 'RFID1', 10, 100)).rejects.toThrow('Transaction Fail');
  });

  it('should successfully receive item and mark PO as PROCESS (no userId, use location_code)', async () => {
    const mockInbound = { id: 1, status: 'PENDING', save: jest.fn() };
    const mockInboundItem = { id: 20, qty_received: 5, qty_target: 10, save: jest.fn() };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundLog.findOne.mockResolvedValue(null);
    Location.findByPk.mockResolvedValue({ id: 10, location_code: 'LocCode1' });

    const result = await scanRfidReceived(1, 'RFID1', 10, null);

    expect(mockInboundItem.qty_received).toBe(6);
    expect(InboundLog.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: null,
      area: 'LocCode1'
    }), expect.anything());
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should successfully receive item when PO is already PROCESS', async () => {
    const mockInbound = { id: 1, status: 'PROCESS', save: jest.fn() };
    const mockInboundItem = { id: 20, qty_received: 5, qty_target: 10, save: jest.fn() };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundLog.findOne.mockResolvedValue(null);
    Location.findByPk.mockResolvedValue({ id: 10, location_name: 'Loc1' });

    await scanRfidReceived(1, 'RFID1', 10, 100);

    expect(mockInbound.save).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});