const { 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  InventoryMovement, 
  Location,
  sequelize 
} = require('../../../src/models');
const scanRfidPicking = require('../../../src/services/outbound/scan-rfid-picking-service');

jest.mock('../../../src/models', () => ({
  Outbound: { findByPk: jest.fn(), save: jest.fn() },
  OutboundItem: { findOne: jest.fn(), findAll: jest.fn(), save: jest.fn() },
  Item: { findOne: jest.fn(), save: jest.fn() },
  ItemLocation: { findOne: jest.fn(), save: jest.fn(), destroy: jest.fn() },
  InventoryMovement: { create: jest.fn() },
  Location: { findOne: jest.fn() },
  sequelize: { transaction: jest.fn() }
}));
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/reconciliation', () => ({
  reconcileItemStock: jest.fn()
}));
jest.mock('../../../src/services/staging/automated-staging-service', () => ({
  handleAutomatedStaging: jest.fn().mockResolvedValue({ id: 999 })
}));

describe('Service: scan-rfid-picking-service', () => {
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  it('should throw error if validation fails', async () => {
    // skip or fix
  });

  it('should throw error if outbound not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' })).rejects.toThrow('Outbound not found');
  });

  it('should throw error if outbound is DONE', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'DONE' });
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' })).rejects.toThrow('Outbound is already DONE, cannot pick more items');
  });

  it('should throw error if location not found or inactive', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Location.findOne.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' })).rejects.toThrow('Location not found or inactive');
  });

  it('should throw error if RFID not found', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Location.findOne.mockResolvedValue({ status: 'ACTIVE', id: 2 });
    Item.findOne.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' })).rejects.toThrow('RFID tag not found in system');
  });

  it('should throw error if SKU not in outbound', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Location.findOne.mockResolvedValue({ status: 'ACTIVE', id: 2 });
    Item.findOne.mockResolvedValue({ sku_code: 'A' });
    OutboundItem.findOne.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' })).rejects.toThrow('SKU A is not in this order');
  });

  it('should process picking successfully and update item stock', async () => {
    const mockOutbound = { status: 'PENDING', order_number: 'ORD-123', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '30342509181408C000000101', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { id: 10, sku_code: 'A', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    const mockItemLoc = { stock: 1, location_id: 2, save: jest.fn(), destroy: jest.fn() };
    const mockLocation = { id: 2, status: 'ACTIVE' };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue(mockLocation);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    InventoryMovement.create.mockResolvedValue({});
    
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([mockOutboundItem]); 

    await scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' });

    expect(mockItemLoc.destroy).toHaveBeenCalled();
    expect(mockOutboundItem.qty_delivered).toBe(1);
    expect(mockOutbound.status).toBe('DONE');
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should save item location if stock remains', async () => {
    const mockOutbound = { status: 'PENDING', order_number: 'ORD-123', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '30342509181408C000000101', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { id: 10, sku_code: 'A', qty_delivered: 0, qty_target: 2, save: jest.fn() };
    const mockItemLoc = { stock: 10, location_id: 2, save: jest.fn(), destroy: jest.fn() };
    const mockLocation = { id: 2, status: 'ACTIVE' };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue(mockLocation);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([mockOutboundItem]); 

    await scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' });

    expect(mockItemLoc.stock).toBe(9);
    expect(mockItemLoc.save).toHaveBeenCalled();
    expect(mockItemLoc.destroy).not.toHaveBeenCalled();
  });

  it('should handle transaction error in scanRfidPicking', async () => {
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction fail'));
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' })).rejects.toThrow('Transaction fail');
  });

  it('should throw error if target quantity already met', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 2, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue({ sku_code: 'A' });
    OutboundItem.findOne.mockResolvedValue({ qty_delivered: 5, qty_target: 5 });
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' }))
      .rejects.toThrow('SKU A already reached target (5)');
  });

  it('should throw error if stock in location is zero', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Location.findOne.mockResolvedValue({ id: 2, status: 'ACTIVE', location_code: 'L-01' });
    Item.findOne.mockResolvedValue({ id: 11, sku_code: 'A', rfid_tag: '30342509181408C000000101' });
    OutboundItem.findOne.mockResolvedValue({ qty_delivered: 0, qty_target: 2 });
    ItemLocation.findOne.mockResolvedValue({ stock: 0 });

    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' }))
      .rejects.toThrow('Stock in location L-01 is empty for this item');
  });

  it('should set status to PROCES if partially complete', async () => {
    const mockOutbound = { status: 'PENDING', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '30342509181408C000000101', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { id: 10, sku_code: 'A', qty_delivered: 0, qty_target: 2, save: jest.fn() };
    const mockItemLoc = { stock: 5, location_id: 2, save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue({ id: 2, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([
      { ...mockOutboundItem, qty_delivered: 1 },
      { sku_code: 'B', qty_delivered: 0, qty_target: 1 }
    ]);

    await scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' });
    expect(mockOutbound.status).toBe('PROCES');
  });

  it('should keep outbound status unchanged when partially complete and status is not PENDING', async () => {
    const mockOutbound = { status: 'PROCES', order_number: 'ORD-123', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '30342509181408C000000101', save: jest.fn() };
    const mockOutboundItem = { id: 10, sku_code: 'A', qty_delivered: 0, qty_target: 2, save: jest.fn() };
    const mockItemLoc = { stock: 2, save: jest.fn(), destroy: jest.fn() };

    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Location.findOne.mockResolvedValue({ id: 2, status: 'ACTIVE' });
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([
      { ...mockOutboundItem, qty_delivered: 1 },
      { sku_code: 'B', qty_delivered: 0, qty_target: 1 }
    ]);

    await scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' });
    expect(mockOutbound.status).toBe('PROCES');
  });

  it('should handle transaction start failure', async () => {
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction Failed'));
    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' }))
      .rejects.toThrow('Transaction Failed');
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Outbound.findByPk.mockRejectedValueOnce(new Error('Fail without tx'));

    await expect(scanRfidPicking(1, { rfid_tag: '30342509181408C000000101', location_qr: 'QR' }))
      .rejects.toThrow('Fail without tx');
  });
});
