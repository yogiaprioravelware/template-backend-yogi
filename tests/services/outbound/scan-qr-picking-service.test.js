const { scanQrPicking } = require('../../../src/services/outbound/scan-qr-picking-service');
const { Outbound, OutboundItem, Item, ItemLocation, Location, OutboundLog, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Outbound: {
    findByPk: jest.fn(),
  },
  OutboundItem: {
    findOne: jest.fn(),
  },
  Item: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  ItemLocation: {
    findOne: jest.fn(),
  },
  Location: {
    findOne: jest.fn(),
  },
  OutboundLog: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: scan-qr-picking-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if outbound not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("Outbound not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if outbound is already DONE', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'DONE' });
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("Outbound is already DONE");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if location not found or inactive', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue(null);
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("Location not found or inactive");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if RFID tag not found in system', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue(null);
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("RFID tag not found in system");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if SKU is not in this order', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue(null);
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("SKU SKU1 is not in this order");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if RFID has already been picked for this order', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue({ id: 30 });
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("Item with this RFID has already been picked or staged for this order");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if SKU already reached target', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 1 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([{ rfid_tag: 'RFID2' }]);
    Item.findAll.mockResolvedValue([{ rfid_tag: 'RFID2', sku_code: 'SKU1' }]);
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("SKU SKU1 already reached target (1)");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if stock in location is empty', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE', location_code: 'LOC1' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([]);
    ItemLocation.findOne.mockResolvedValue(null);
    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("Stock in location LOC1 is empty for this item");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should successfully pick item and update PO status', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', save: jest.fn() };
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([]);
    ItemLocation.findOne.mockResolvedValue({ id: 40, stock: 10 });

    const result = await scanQrPicking(1, 'QR1', 'RFID1');

    expect(mockOutbound.status).toBe('PROCESS');
    expect(mockOutbound.save).toHaveBeenCalled();
    expect(OutboundLog.create).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.status).toBe('PICKED');
  });

  it('should successfully pick item and update status if already PROCESS', async () => {
    const mockOutbound = { id: 1, status: 'PROCESS', save: jest.fn() };
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([]);
    ItemLocation.findOne.mockResolvedValue({ id: 40, stock: 10 });

    await scanQrPicking(1, 'QR1', 'RFID1');

    expect(mockOutbound.save).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should successfully pick item and when pickedRfidTags is empty', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', save: jest.fn() };
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([]);
    ItemLocation.findOne.mockResolvedValue({ id: 40, stock: 10 });

    await scanQrPicking(1, 'QR1', 'RFID1');
    expect(Item.findAll).not.toHaveBeenCalled();
  });

  it('should handle error when transaction creation fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction Fail'));
    await expect(scanQrPicking(1, 'QR1', 'RFID1')).rejects.toThrow('Transaction Fail');
  });

  it('should handle negative itemLoc stock gracefully', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE', location_code: 'LOC1' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([]);
    ItemLocation.findOne.mockResolvedValue({ id: 40, stock: 0 });

    await expect(scanQrPicking(1, 'QR1', 'RFID1'))
      .rejects.toThrow("Stock in location LOC1 is empty for this item");
  });

  it('should successfully pick item when some items are already picked but target not reached', async () => {
    const mockOutbound = { id: 1, status: 'PROCESS', save: jest.fn() };
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue({ id: 20, qty_target: 5 });
    OutboundLog.findOne.mockResolvedValue(null);
    OutboundLog.findAll.mockResolvedValue([{ rfid_tag: 'RFID2' }]);
    Item.findAll.mockResolvedValue([{ rfid_tag: 'RFID2', sku_code: 'SKU1' }]); // 1 picked, target 5
    ItemLocation.findOne.mockResolvedValue({ id: 40, stock: 10 });

    const result = await scanQrPicking(1, 'QR1', 'RFID1');

    expect(result.status).toBe('PICKED');
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    Outbound.findByPk.mockRejectedValue(new Error('DB Error'));
    await expect(scanQrPicking(1, 'QR1', 'RFID1')).rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});