const { finalizeOutbound } = require('../../../src/services/outbound/finalize-outbound-service');
const { Outbound, OutboundItem, OutboundLog, Item, ItemLocation, InventoryMovement, sequelize } = require('../../../src/models');
const { reconcileItemStock } = require('../../../src/utils/reconciliation');

jest.mock('../../../src/models', () => ({
  Outbound: {
    findByPk: jest.fn(),
  },
  OutboundItem: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  OutboundLog: {
    findAll: jest.fn(),
  },
  Item: {
    findOne: jest.fn(),
  },
  ItemLocation: {
    findOne: jest.fn(),
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

describe('Service: finalize-outbound-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if outbound order not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(finalizeOutbound(1, 100))
      .rejects.toThrow("Outbound order not found");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if order is already DONE', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'DONE' });
    await expect(finalizeOutbound(1, 100))
      .rejects.toThrow("Order is already finalized (DONE)");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw error if no items in STAGED status', async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    OutboundLog.findAll.mockResolvedValue([]);
    await expect(finalizeOutbound(1, 100))
      .rejects.toThrow("No items in STAGED status. Please perform picking and staging first.");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should successfully finalize outbound and set status to DONE if fully fulfilled', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', order_number: 'ORD1', save: jest.fn() };
    const mockLog = { rfid_tag: 'RFID1', location_id: 10, status: 'STAGED', save: jest.fn() };
    const mockOutboundItem = { sku_code: 'SKU1', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    const mockItemLoc = { id: 40, stock: 1, save: jest.fn(), destroy: jest.fn() };

    Outbound.findByPk.mockResolvedValue(mockOutbound);
    OutboundLog.findAll.mockResolvedValue([mockLog]);
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([mockOutboundItem]);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    const result = await finalizeOutbound(1, 100);

    expect(mockOutboundItem.qty_delivered).toBe(1);
    expect(mockItemLoc.destroy).toHaveBeenCalled();
    expect(mockOutbound.status).toBe('DONE');
    expect(mockOutbound.save).toHaveBeenCalled();
    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      operator_name: 'USER_100'
    }), expect.anything());
    expect(reconcileItemStock).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.status).toBe('DONE');
  });

  it('should successfully finalize outbound and use SYSTEM as operator if userId is null', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', order_number: 'ORD1', save: jest.fn() };
    const mockLog = { rfid_tag: 'RFID1', location_id: 10, status: 'STAGED', save: jest.fn() };
    const mockOutboundItem = { sku_code: 'SKU1', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    const mockItemLoc = { id: 40, stock: 1, save: jest.fn(), destroy: jest.fn() };

    Outbound.findByPk.mockResolvedValue(mockOutbound);
    OutboundLog.findAll.mockResolvedValue([mockLog]);
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([mockOutboundItem]);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    await finalizeOutbound(1, null);

    expect(InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      operator_name: 'SYSTEM'
    }), expect.anything());
  });

  it('should continue if item is not found in logs loop', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', order_number: 'ORD1', save: jest.fn() };
    const mockLog = { rfid_tag: 'RFID1', location_id: 10, status: 'STAGED', save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    OutboundLog.findAll.mockResolvedValue([mockLog]);
    Item.findOne.mockResolvedValue(null);
    OutboundItem.findAll.mockResolvedValue([]);

    await finalizeOutbound(1, 100);

    expect(OutboundItem.findOne).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should handle missing outboundItem or itemLoc gracefully', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', order_number: 'ORD1', save: jest.fn() };
    const mockLog = { rfid_tag: 'RFID1', location_id: 10, status: 'STAGED', save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    OutboundLog.findAll.mockResolvedValue([mockLog]);
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue(null);
    ItemLocation.findOne.mockResolvedValue(null);
    OutboundItem.findAll.mockResolvedValue([]);

    await finalizeOutbound(1, 100);

    expect(InventoryMovement.create).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    Outbound.findByPk.mockRejectedValue(new Error('DB Error'));
    await expect(finalizeOutbound(1, 100)).rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle error when transaction creation fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction Fail'));
    await expect(finalizeOutbound(1, 100)).rejects.toThrow('Transaction Fail');
  });

  it('should successfully finalize outbound and set status to PROCESS if partially fulfilled', async () => {
    const mockOutbound = { id: 1, status: 'PENDING', order_number: 'ORD1', save: jest.fn() };
    const mockLog = { rfid_tag: 'RFID1', location_id: 10, status: 'STAGED', save: jest.fn() };
    const mockOutboundItem = { sku_code: 'SKU1', qty_delivered: 0, qty_target: 2, save: jest.fn() };
    const mockItemLoc = { id: 40, stock: 5, save: jest.fn(), destroy: jest.fn() };

    Outbound.findByPk.mockResolvedValue(mockOutbound);
    OutboundLog.findAll.mockResolvedValue([mockLog]);
    Item.findOne.mockResolvedValue({ id: 10, sku_code: 'SKU1' });
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([mockOutboundItem]);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    const result = await finalizeOutbound(1, 100);

    expect(mockOutboundItem.qty_delivered).toBe(1);
    expect(mockItemLoc.stock).toBe(4);
    expect(mockItemLoc.save).toHaveBeenCalled();
    expect(mockOutbound.status).toBe('PROCESS');
    expect(mockOutbound.save).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.status).toBe('PROCESS');
  });
});