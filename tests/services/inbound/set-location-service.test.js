const { setLocation } = require('../../../src/services/inbound/set-location-service');
const { Location, Inbound, InboundReceivingLog, Item, InboundItem, ItemLocation, InventoryMovement, sequelize } = require('../../../src/models');
const { reconcileItemStock } = require('../../../src/utils/reconciliation');

jest.mock('../../../src/models', () => ({
  Location: {
    findOne: jest.fn(),
  },
  Inbound: {
    findByPk: jest.fn(),
  },
  InboundReceivingLog: {
    create: jest.fn(),
  },
  Item: {
    findOne: jest.fn(),
  },
  InboundItem: {
    findOne: jest.fn(),
    findAll: jest.fn(),
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
  reconcileItemStock: jest.fn(),
}));

describe('Service: set-location-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if location not found', async () => {
    Location.findOne.mockResolvedValue(null);
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Location QR code not found');
  });

  it('should throw error if location is inactive', async () => {
    Location.findOne.mockResolvedValue({ status: 'INACTIVE' });
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Location is inactive for receiving');
  });

  it('should throw error if inbound not found', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue(null);
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Inbound PO not found');
  });

  it('should throw error if inbound item not found', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    InboundItem.findOne.mockResolvedValue(null);
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Item not found in this PO');
  });

  it('should throw error if item quantity already completed', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    InboundItem.findOne.mockResolvedValue({ qty_received: 5, qty_target: 5 });
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Item target quantity already completed');
  });

  it('should successfully set location and update to PROCES (partial complete)', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    const mockInbound = { id: 1, status: 'PENDING', save: jest.fn(), toJSON: () => ({ id: 1, status: 'PROCES' }) };
    Inbound.findByPk.mockResolvedValue(mockInbound);

    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundReceivingLog.create.mockResolvedValue({});

    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    ItemLocation.findOne.mockResolvedValue({ stock: 5, save: jest.fn() });
    InventoryMovement.create.mockResolvedValue({});

    InboundItem.findAll.mockResolvedValue([
      { qty_target: 2, qty_received: 1 },
      { qty_target: 5, qty_received: 0 }
    ]);

    const result = await setLocation(1, 1, 'QR1');
    expect(result.inbound_progress.status).toBe('PROCES');
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should skip item location update if item not found in system', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    const mockInbound = { id: 1, status: 'PENDING', save: jest.fn(), po_number: 'PO1' };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    const mockInboundItem = { id: 20, sku_code: 'SKU_UNKNOWN', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    Item.findOne.mockResolvedValue(null); // Item not found
    InboundItem.findAll.mockResolvedValue([mockInboundItem]);

    const result = await setLocation(1, 1, 'QR1');
    expect(result.message).toBe('Item received successfully');
    expect(ItemLocation.findOne).not.toHaveBeenCalled();
  });

  it('should handle transaction error in setLocation', async () => {
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction fail'));
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Transaction fail');
  });

  it('should successfully set location and update to DONE (all complete)', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    const mockInbound = { id: 1, status: 'PROCES', save: jest.fn(), toJSON: () => ({ id: 1, status: 'DONE' }) };
    Inbound.findByPk.mockResolvedValue(mockInbound);

    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 1, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundReceivingLog.create.mockResolvedValue({});

    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    ItemLocation.findOne.mockResolvedValue(null);
    ItemLocation.create.mockResolvedValue({ stock: 1, save: jest.fn() });
    InventoryMovement.create.mockResolvedValue({});

    InboundItem.findAll.mockResolvedValue([
      { qty_target: 2, qty_received: 2 },
      { qty_target: 5, qty_received: 5 }
    ]);

    const result = await setLocation(1, 1, 'QR1');
    expect(result.inbound_progress.status).toBe('DONE');
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should successfully set location when itemLoc already exists', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    const mockInbound = { id: 1, status: 'PROCES', save: jest.fn(), toJSON: () => ({ id: 1 }) };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    
    const mockItemLoc = { stock: 5, save: jest.fn() };
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    InboundItem.findAll.mockResolvedValue([mockInboundItem]);

    await setLocation(1, 1, 'QR1');
    expect(mockItemLoc.save).toHaveBeenCalled();
  });

  it('should handle crash and rollback', async () => {
    Location.findOne.mockRejectedValue(new Error('Crash DB'));
    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Crash DB');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Location.findOne.mockRejectedValueOnce(new Error('Crash without tx'));

    await expect(setLocation(1, 1, 'QR1')).rejects.toThrow('Crash without tx');
  });
});
