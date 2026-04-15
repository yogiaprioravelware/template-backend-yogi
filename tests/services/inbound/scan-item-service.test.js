const { scanItem } = require('../../../src/services/inbound/scan-item-service');
const { Inbound, Item, InboundItem } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Inbound: {
    findByPk: jest.fn(),
  },
  Item: {
    findOne: jest.fn(),
  },
  InboundItem: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: scan-item-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if inbound not found', async () => {
    Inbound.findByPk.mockResolvedValue(null);
    await expect(scanItem(1, 'RFID1')).rejects.toThrow('Inbound PO not found');
  });

  it('should throw error if inbound is DONE', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'DONE' });

    await expect(scanItem(1, 'RFID1')).rejects.toThrow('Inbound PO is already completed');
  });

  it('should throw error if item by RFID not found', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue(null);
    await expect(scanItem(1, 'RFID1')).rejects.toThrow('RFID tag not found in system');
  });

  it('should throw error if inbound_item not found for SKU', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue(null);
    
    await expect(scanItem(1, 'RFID1')).rejects.toThrow('SKU SKU1 is not in this PO');
  });

  it('should throw error if qty_received already meets target', async () => {
    Inbound.findByPk.mockResolvedValue({ status: 'PENDING' });
    Item.findOne.mockResolvedValue({ sku_code: 'SKU1' });
    InboundItem.findOne.mockResolvedValue({ qty_received: 5, qty_target: 5 });
    
    await expect(scanItem(1, 'RFID1')).rejects.toThrow('Item target quantity already completed');
  });

  it('should return item info successfully', async () => {
    Inbound.findByPk.mockResolvedValue({ id: 1, status: 'PENDING' });
    Item.findOne.mockResolvedValue({ id: 99, rfid_tag: 'RFID1', sku_code: 'SKU1', item_name: 'test', category: 'C', uom: 'U' });
    InboundItem.findOne.mockResolvedValue({ id: 88, qty_target: 10, qty_received: 5 });
    
    const result = await scanItem(1, 'RFID1');
    expect(result.item.rfid_tag).toBe('RFID1');
    expect(result.pending_location).toBe(true);
  });
});
