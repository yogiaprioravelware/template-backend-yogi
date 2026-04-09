const registerItem = require('../../../src/services/item/register-item-service');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: register-item-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    const invalidData = { rfid_tag: '123' }; // missing other fields
    await expect(registerItem(invalidData)).rejects.toThrow();
  });

  it('should throw error if rfid is already registered', async () => {
    const validData = { rfid_tag: '123', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10 };
    Item.findOne.mockResolvedValueOnce({ id: 1 }); // RFID exists

    await expect(registerItem(validData)).rejects.toThrow('RFID tag already registered');
  });

  it('should throw error if sku is already registered', async () => {
    const validData = { rfid_tag: '123', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10 };
    Item.findOne.mockResolvedValueOnce(null); // RFID clean
    Item.findOne.mockResolvedValueOnce({ id: 2 }); // SKU exists

    await expect(registerItem(validData)).rejects.toThrow('SKU code already registered');
  });

  it('should register item successfully', async () => {
    const validData = { rfid_tag: '123', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10 };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ dataValues: { id: 1, ...validData } });

    const result = await registerItem(validData);

    expect(Item.create).toHaveBeenCalledWith(validData);
    expect(result).toHaveProperty('id');
  });
});
