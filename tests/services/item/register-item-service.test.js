const registerItem = require('../../../src/services/item/register-item-service');
const { Item, Location, ItemLocation, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Location: {
    findOne: jest.fn(),
  },
  ItemLocation: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: register-item-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if rfid format is not EPC (starts with 30 and 24 hex)', async () => {
    const invalidData = { rfid_tag: 'FF342509181408C000000101', item_name: 'Test', sku_code: 'SKU', category: 'C', uom: 'PCS', current_stock: 0 };
    await expect(registerItem(invalidData)).rejects.toThrow(/Invalid RFID format/);
  });

  it('should throw error if rfid is already registered', async () => {
    const validData = { rfid_tag: '30342509181408C000000001', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: 1 };
    Item.findOne.mockResolvedValueOnce({ id: 1 }); // RFID exists

    await expect(registerItem(validData)).rejects.toThrow('RFID tag already registered');
  });

  it('should throw error if sku is already registered', async () => {
    const validData = { rfid_tag: '30342509181408C000000001', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: 1 };
    Item.findOne.mockResolvedValueOnce(null); // RFID clean
    Item.findOne.mockResolvedValueOnce({ id: 2 }); // SKU exists

    await expect(registerItem(validData)).rejects.toThrow('SKU code already registered');
  });

  it('should register item successfully', async () => {
    const validData = { rfid_tag: '30342509181408C000000001', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: 1 };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, toJSON: () => ({ id: 1, ...validData }) });
    ItemLocation.create.mockResolvedValue({});

    const result = await registerItem(validData);

    expect(Item.create).toHaveBeenCalledWith(validData, { transaction: mockTransaction });
    expect(ItemLocation.create).toHaveBeenCalledWith({
      item_id: 1,
      location_id: 1,
      stock: 10
    }, { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
  });

  it('should assign to default receiving area if location_id is not provided', async () => {
    const validData = { rfid_tag: '30342509181408C000000101', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: null };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, toJSON: () => ({ id: 1, ...validData }) });
    Location.findOne.mockResolvedValue({ id: 99 });
    ItemLocation.create.mockResolvedValue({});

    const result = await registerItem(validData);

    expect(Location.findOne).toHaveBeenCalledWith({ where: { location_code: 'RECEIVING-01' }, transaction: mockTransaction });
    expect(ItemLocation.create).toHaveBeenCalledWith({
      item_id: 1,
      location_id: 99,
      stock: 10
    }, { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should register item but warn if default receiving area is also not found', async () => {
    const validData = { rfid_tag: '30342509181408C000000101', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: null };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, toJSON: () => ({ id: 1, ...validData }) });
    Location.findOne.mockResolvedValue(null);

    const result = await registerItem(validData);

    expect(Location.findOne).toHaveBeenCalledWith({ where: { location_code: 'RECEIVING-01' }, transaction: mockTransaction });
    expect(ItemLocation.create).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should register item without assigning location if current_stock is 0', async () => {
    const validData = { rfid_tag: '30342509181408C000000101', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 0, location_id: 1 };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, toJSON: () => ({ id: 1, ...validData }) });

    const result = await registerItem(validData);

    expect(Item.create).toHaveBeenCalledWith(validData, { transaction: mockTransaction });
    expect(ItemLocation.create).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should handle transaction error in registerItem', async () => {
    const validData = { rfid_tag: '30342509181408C000000001', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: 1 };
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction fail'));
    await expect(registerItem(validData)).rejects.toThrow('Transaction fail');
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    const validData = { rfid_tag: '30342509181408C000000001', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: 1 };
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Item.findOne.mockRejectedValueOnce(new Error('Lookup failed without tx'));

    await expect(registerItem(validData)).rejects.toThrow('Lookup failed without tx');
  });
});
