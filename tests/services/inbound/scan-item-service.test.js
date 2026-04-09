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
    expect(result.message).toBe('PO tidak ditemukan');
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
    expect(result.message).toBe('Item dengan RFID tag tidak ditemukan');
  });

  it('should return error if inbound_item not found for SKU', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue(null);
    
    const result = await scanItem(1, 'RFID1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('SKU SKU1 tidak ada dalam PO ini');
  });
});
