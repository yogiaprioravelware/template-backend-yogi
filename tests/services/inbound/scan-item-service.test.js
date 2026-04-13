const { scanItem } = require('../../../src/services/inbound/scan-item-service');
const Item = require('../../../src/models/Item');
const Inbound = require('../../../src/models/Inbound');
const InboundItem = require('../../../src/models/InboundItem');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/utils/logger');

describe('Service: scan-item-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if inbound not found', async () => {
    Inbound.findByPk.mockResolvedValue(null);
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Inbound PO not found');
  });

  it('should return error if inbound is DONE', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'DONE' });
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
  });

  it('should return error if item by RFID not found', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue(null);
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('RFID tag not found in system');
  });

  it('should return error if inbound_item not found for SKU', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue(null);
    
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('SKU SKU1 is not in this PO');
  });
  it('should return error if qty_received already meets target', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue({ qty_received: 5, qty_target: 5 });
    
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Item target quantity already completed');
  });

  it('should return success and pending location', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ id: 99, rfid_tag: 'RFID1', sku_code: 'SKU1', item_name: 'test', category: 'C', uom: 'U' });
    InboundItem.findOne.mockResolvedValue({ id: 88, qty_target: 10, qty_received: 5 });
    
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.data.pending_location).toBe(true);
  });

  it('should return 500 error if exception is thrown', async () => {
    Inbound.findByPk.mockRejectedValue(new Error('Database error'));
    
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Database error');
  });
});
