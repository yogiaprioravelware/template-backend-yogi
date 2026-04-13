const { setLocation } = require('../../../src/services/inbound/set-location-service');
const Location = require('../../../src/models/Location');
const Inbound = require('../../../src/models/Inbound');

const InboundReceivingLog = require('../../../src/models/InboundReceivingLog');
const Item = require('../../../src/models/Item');
const InboundItem = require('../../../src/models/InboundItem');

jest.mock('../../../src/models/Item', () => {
  const SequelizeModel = class { };
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.findByPk = jest.fn();
  SequelizeModel.findAll = jest.fn();
  SequelizeModel.create = jest.fn();
  SequelizeModel.update = jest.fn();
  SequelizeModel.destroy = jest.fn();
  SequelizeModel.hasMany = jest.fn();
  SequelizeModel.belongsToMany = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/ItemLocation', () => {
  const SequelizeModel = class { };
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.create = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/Location', () => {
  const SequelizeModel = class { };
  SequelizeModel.findOne = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/InventoryMovement', () => {
  const SequelizeModel = class { };
  SequelizeModel.create = jest.fn();
  SequelizeModel.belongsTo = jest.fn();
  return SequelizeModel;
});

jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/models/InboundReceivingLog');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/database', () => ({
  transaction: jest.fn(() => ({
    commit: jest.fn(),
    rollback: jest.fn()
  })),
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    sum: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    destroy: jest.fn(),
  })),
}));
jest.mock('../../../src/utils/reconciliation', () => ({
  reconcileItemStock: jest.fn()
}));

describe('Service: set-location-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if location not found', async () => {
    Location.findOne.mockResolvedValue(null);
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Location QR code not found');
  });

  it('should return error if location is inactive', async () => {
    Location.findOne.mockResolvedValue({ status: 'INACTIVE' });
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Location is inactive for receiving');
  });

  it('should return error if inbound not found', async () => {
    Location.findOne.mockResolvedValue({ status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue(null);
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
  });
  it('should return error if inbound item not found', async () => {
    Location.findOne.mockResolvedValue({ status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    InboundItem.findOne.mockResolvedValue(null);
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Item not found in this PO');
  });

  it('should return error if item quantity already completed', async () => {
    Location.findOne.mockResolvedValue({ status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    InboundItem.findOne.mockResolvedValue({ qty_received: 5, qty_target: 5 });
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Item target quantity already completed');
  });

  it('should successfully set location and update to PROCES (partial complete)', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING', save: jest.fn() });

    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundReceivingLog.create.mockResolvedValue({});

    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });

    const ItemLocation = require('../../../src/models/ItemLocation');
    ItemLocation.findOne.mockResolvedValue({ stock: 5, save: jest.fn() });

    const InventoryMovement = require('../../../src/models/InventoryMovement');
    InventoryMovement.create.mockResolvedValue({});

    // Simulate all items to see if it becomes PROCES (not all complete)
    InboundItem.findAll.mockResolvedValue([
      { qty_target: 2, qty_received: 1 }, // this item after +1 is 1. not complete
      { qty_target: 5, qty_received: 0 }
    ]);

    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(true);
    expect(result.data.inbound_progress.status).toBe('PROCES');
  });

  it('should successfully set location and update to DONE (all complete)', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PROCES', save: jest.fn() });

    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 1, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundReceivingLog.create.mockResolvedValue({});

    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });

    const ItemLocation = require('../../../src/models/ItemLocation');
    ItemLocation.findOne.mockResolvedValue(null);
    ItemLocation.create.mockResolvedValue({ stock: 1, save: jest.fn() });

    const InventoryMovement = require('../../../src/models/InventoryMovement');
    InventoryMovement.create.mockResolvedValue({});

    // Simulate all items to see if it becomes DONE
    InboundItem.findAll.mockResolvedValue([
      { qty_target: 2, qty_received: 2 }, // this item becomes 2, complete
      { qty_target: 5, qty_received: 5 }
    ]);

    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(true);
    expect(result.data.inbound_progress.status).toBe('DONE');
  });

  it('should successfully set location and handle missing Item DB mapping safely', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PROCES', save: jest.fn() });

    // Partially complete item
    const mockInboundItem = { id: 20, sku_code: 'SKU_ORPHAN', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundReceivingLog.create.mockResolvedValue({});

    // Simulate Item.findOne returning null (item mapping missing)
    Item.findOne.mockResolvedValue(null);

    InboundItem.findAll.mockResolvedValue([
      { qty_target: 2, qty_received: 1 }
    ]);

    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(true);
    // Cover 'item' not found branch (line 96)
    const { reconcileItemStock } = require('../../../src/utils/reconciliation');
    expect(reconcileItemStock).not.toHaveBeenCalled();
  });

  it('should successfully set location when itemLoc already exists', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PROCES', save: jest.fn() });
    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    
    // Cover branch: itemLoc exists (line 103)
    const ItemLocation = require('../../../src/models/ItemLocation');
    const mockItemLoc = { stock: 5, save: jest.fn() };
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    InboundItem.findAll.mockResolvedValue([mockInboundItem]);

    await setLocation(1, 1, 'QR1');
    expect(mockItemLoc.save).toHaveBeenCalled();
  });

  it('should successfully set location and NOT update status if already PROCES', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    const mockInbound = { id: 1, status: 'PROCES', save: jest.fn() };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    
    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 0, qty_target: 5, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    Item.findOne.mockResolvedValue({ id: 100, sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    
    InboundItem.findAll.mockResolvedValue([mockInboundItem]);

    const result = await setLocation(1, 1, 'QR1');
    
    // Status was PROCES and not all complete, so it should stay PROCES
    // The code only updates if status is PENDING. This covers the 'else' of 'else if (PENDING)' (line 147)
    expect(mockInbound.status).toBe('PROCES');
    expect(mockInbound.save).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'PROCES' }));
  });

  it('should handle crash and return 500 error', async () => {
    Location.findOne.mockRejectedValue(new Error('Crash DB'));
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Crash DB');
  });

  it('should handle transaction start failure', async () => {
    const sequelize = require('../../../src/utils/database');
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction Failed'));
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Transaction Failed');
  });
});
