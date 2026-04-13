const updateItem = require('../../../src/services/item/update-item-service');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: update-item-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    const invalidData = { uom: 'KILO' };
    await expect(updateItem(1, invalidData)).rejects.toThrow();
  });

  it('should throw error if item not found', async () => {
    Item.findByPk.mockResolvedValue(null);
    await expect(updateItem(999, { current_stock: 5 })).rejects.toThrow('Item not found');
  });

  it('should throw error if new rfid is taken', async () => {
    const mockItem = { id: 1, rfid_tag: '30342509181408C000000001' };
    Item.findByPk.mockResolvedValue(mockItem);
    Item.findOne.mockResolvedValue({ id: 2 }); // Another item has this RFID

    await expect(updateItem(1, { rfid_tag: '30342509181408C000000002' })).rejects.toThrow('RFID tag already in use');
  });

  it('should throw error if new sku is taken', async () => {
    const mockItem = { id: 1, sku_code: 'oldSKU' };
    Item.findByPk.mockResolvedValue(mockItem);
    Item.findOne.mockResolvedValue({ id: 2 }); // Another item has this SKU

    await expect(updateItem(1, { sku_code: 'newSKU' })).rejects.toThrow('SKU code already in use');
  });

  it('should update item successfully', async () => {
    const mockItem = { id: 1, rfid_tag: '30342509181408C000000001', update: jest.fn().mockResolvedValue(true) };
    Item.findByPk.mockResolvedValue(mockItem);

    const result = await updateItem(1, { current_stock: 50 });

    expect(mockItem.update).toHaveBeenCalledWith({ current_stock: 50 });
    expect(result).toBe(mockItem);
  });

  it('should update item successfully when changing rfid and sku to available ones', async () => {
    const mockItem = { id: 1, rfid_tag: '30342509181408C000000001', sku_code: 'sku1', update: jest.fn().mockResolvedValue(true) };
    Item.findByPk.mockResolvedValue(mockItem);
    Item.findOne.mockResolvedValue(null); // No existing rfid/sku

    const result = await updateItem(1, { rfid_tag: '30342509181408C000000002', sku_code: 'sku2' });

    expect(Item.findOne).toHaveBeenCalledTimes(2); // checked both
    expect(mockItem.update).toHaveBeenCalledWith({ rfid_tag: '30342509181408C000000002', sku_code: 'sku2' });
  });
});
