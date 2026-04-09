const { setLocation } = require('../../../src/services/inbound/set-location-service');
const Location = require('../../../src/models/Location');
const Inbound = require('../../../src/models/Inbound');

const InboundReceivingLog = require('../../../src/models/InboundReceivingLog');
const Item = require('../../../src/models/Item');
const InboundItem = require('../../../src/models/InboundItem');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/models/Location');
jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/models/InboundReceivingLog');
jest.mock('../../../src/utils/logger');

describe('Service: set-location-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if location not found', async () => {
    Location.findOne.mockResolvedValue(null);
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Lokasi dengan QR code tidak ditemukan');
  });

  it('should return error if location is inactive', async () => {
    Location.findOne.mockResolvedValue({ status: 'INACTIVE' });
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Lokasi tidak aktif untuk penerimaan');
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
    expect(result.message).toBe('Item dalam PO tidak ditemukan');
  });

  it('should return error if item quantity already completed', async () => {
    Location.findOne.mockResolvedValue({ status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    InboundItem.findOne.mockResolvedValue({ qty_received: 5, qty_target: 5 });
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Jumlah penerimaan untuk SKU sudah mencapai target');
  });

  it('should successfully set location and update to PROCES (partial complete)', async () => {
    Location.findOne.mockResolvedValue({ id: 10, status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING', save: jest.fn() });
    
    const mockInboundItem = { id: 20, sku_code: 'SKU1', qty_received: 0, qty_target: 2, save: jest.fn() };
    InboundItem.findOne.mockResolvedValue(mockInboundItem);
    InboundReceivingLog.create.mockResolvedValue({});
    
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    
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
    
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1', current_stock: 10, save: jest.fn() });
    
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
  });

  it('should handle crash and return 500 error', async () => {
    Location.findOne.mockRejectedValue(new Error('Crash DB'));
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Crash DB');
  });
});
