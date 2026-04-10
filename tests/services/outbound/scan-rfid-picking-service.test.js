const scanRfidPicking = require('../../../src/services/outbound/scan-rfid-picking-service');
const Outbound = require('../../../src/models/Outbound');
const OutboundItem = require('../../../src/models/OutboundItem');
const Item = require('../../../src/models/Item');

const ItemLocation = require('../../../src/models/ItemLocation');
const InventoryMovement = require('../../../src/models/InventoryMovement');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/models/Item', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.findByPk = jest.fn();
  SequelizeModel.hasMany = jest.fn();
  SequelizeModel.belongsToMany = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/ItemLocation', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/InventoryMovement', () => {
  const SequelizeModel = class {};
  SequelizeModel.create = jest.fn();
  SequelizeModel.belongsTo = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/utils/logger');

describe('Service: scan-rfid-picking-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    await expect(scanRfidPicking(1, {})).rejects.toThrow();
  });

  it('should throw error if outbound not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '123' })).rejects.toThrow('Outbound not found');
  });

  it('should throw error if outbound is DONE', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'DONE' });
    await expect(scanRfidPicking(1, { rfid_tag: '123' })).rejects.toThrow('Outbound sudah DONE, tidak bisa picking barang lagi');
  });

  it('should throw error if RFID not found', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '123' })).rejects.toThrow('RFID tag tidak ditemukan di sistem');
  });

  it('should throw error if SKU not in outbound', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'A' });
    OutboundItem.findOne.mockResolvedValue(null);
    await expect(scanRfidPicking(1, { rfid_tag: '123' })).rejects.toThrow('SKU A tidak ada di order ini');
  });

  it('should process picking successfully and update item stock', async () => {
    const mockOutbound = { status: 'PENDING', order_number: 'ORD-123', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '123', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { sku_code: 'A', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    const mockItemLoc = { stock: 5, location_id: 2, save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    InventoryMovement.create.mockResolvedValue({});
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Item.findOne.mockResolvedValue(mockItem);
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([mockOutboundItem]); // simulate all check

    const result = await scanRfidPicking(1, { rfid_tag: '123' });

    expect(mockItem.current_stock).toBe(9); // decremented
    expect(mockItem.save).toHaveBeenCalled();
    expect(mockOutboundItem.qty_delivered).toBe(1);
    expect(mockOutboundItem.save).toHaveBeenCalled();
    expect(mockOutbound.status).toBe('DONE');
    expect(mockOutbound.save).toHaveBeenCalled();
  });

  it('should throw error if target quantity already met', async () => {
    Outbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'A' });
    OutboundItem.findOne.mockResolvedValue({ qty_delivered: 5, qty_target: 5 });
    await expect(scanRfidPicking(1, { rfid_tag: '123' }))
      .rejects.toThrow('SKU A sudah mencapai target (5)');
  });

  it('should set status to PROCES if partially complete', async () => {
    const mockOutbound = { status: 'PENDING', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '123', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { sku_code: 'A', qty_delivered: 0, qty_target: 2, save: jest.fn() };
    const mockItemLoc = { stock: 5, location_id: 2, save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    InventoryMovement.create.mockResolvedValue({});
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    
    // Simulate finding multiple items where one is not done yet
    OutboundItem.findAll.mockResolvedValue([
      { ...mockOutboundItem, qty_delivered: 1 }, // this item will be 1 out of 2
      { sku_code: 'B', qty_delivered: 0, qty_target: 1 }
    ]);

    const result = await scanRfidPicking(1, { rfid_tag: '123' });
    expect(mockOutbound.status).toBe('PROCES');
  });

  it('should leave status as PROCES if already PROCES and partially complete', async () => {
    const mockOutbound = { status: 'PROCES', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '123', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { sku_code: 'A', qty_delivered: 0, qty_target: 2, save: jest.fn() };
    const mockItemLoc = { stock: 5, location_id: 2, save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    InventoryMovement.create.mockResolvedValue({});
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    
    OutboundItem.findAll.mockResolvedValue([
      { ...mockOutboundItem, qty_delivered: 1 },
      { sku_code: 'B', qty_delivered: 0, qty_target: 1 }
    ]);

    await scanRfidPicking(1, { rfid_tag: '123' });
    
    expect(mockOutbound.save).not.toHaveBeenCalled(); // Shouldn't overwrite status if already PROCES
    expect(mockOutbound.status).toBe('PROCES');
  });

  it('should bypass itemLoc decrements if itemLoc is found but stock is 0', async () => {
    const mockOutbound = { status: 'PENDING', order_number: 'ORD-123', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '123', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { sku_code: 'A', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    const mockItemLoc = { stock: 0, location_id: 2, save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([{...mockOutboundItem, qty_delivered: 1}]);

    await scanRfidPicking(1, { rfid_tag: '123' });

    expect(mockItemLoc.save).not.toHaveBeenCalled();
    expect(mockItem.current_stock).toBe(9); 
    expect(InventoryMovement.create).not.toHaveBeenCalled();
  });

  it('should bypass itemLoc decrements if no itemLoc is found', async () => {
    const mockOutbound = { status: 'PENDING', order_number: 'ORD-123', save: jest.fn() };
    const mockItem = { id: 1, sku_code: 'A', rfid_tag: '123', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { sku_code: 'A', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    
    Outbound.findByPk.mockResolvedValue(mockOutbound);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(null);
    OutboundItem.findOne.mockResolvedValue(mockOutboundItem);
    OutboundItem.findAll.mockResolvedValue([{...mockOutboundItem, qty_delivered: 1}]);

    await scanRfidPicking(1, { rfid_tag: '123' });

    expect(mockItem.current_stock).toBe(9); 
    expect(InventoryMovement.create).not.toHaveBeenCalled();
  });
});
