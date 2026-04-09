const scanRfidPicking = require('../../../src/services/outbound/scan-rfid-picking-service');
const Outbound = require('../../../src/models/Outbound');
const OutboundItem = require('../../../src/models/OutboundItem');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/models/Item');
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
    const mockOutbound = { status: 'PENDING', save: jest.fn() };
    const mockItem = { sku_code: 'A', rfid_tag: '123', current_stock: 10, save: jest.fn() };
    const mockOutboundItem = { sku_code: 'A', qty_delivered: 0, qty_target: 1, save: jest.fn() };
    
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
});
