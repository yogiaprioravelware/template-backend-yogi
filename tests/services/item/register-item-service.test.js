const registerItem = require('../../../src/services/item/register-item-service');
const Item = require('../../../src/models/Item');
const Location = require('../../../src/models/Location');
const ItemLocation = require('../../../src/models/ItemLocation');
const sequelize = require('../../../src/utils/database');

jest.mock('../../../src/models/Item', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  SequelizeModel.create = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/Location', () => {
  const SequelizeModel = class {};
  SequelizeModel.findOne = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/ItemLocation', () => {
  const SequelizeModel = class {};
  SequelizeModel.create = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/database', () => ({
  transaction: jest.fn()
}));

describe('Service: register-item-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    const invalidData = { rfid_tag: '123' }; // missing other fields
    await expect(registerItem(invalidData)).rejects.toThrow();
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
    Item.create.mockResolvedValue({ id: 1, dataValues: { id: 1, ...validData } });
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
    const validData = { rfid_tag: '123', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: null };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, dataValues: { id: 1, ...validData } });
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
    const validData = { rfid_tag: '123', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 10, location_id: null };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, dataValues: { id: 1, ...validData } });
    Location.findOne.mockResolvedValue(null);

    const result = await registerItem(validData);

    expect(Location.findOne).toHaveBeenCalledWith({ where: { location_code: 'RECEIVING-01' }, transaction: mockTransaction });
    expect(ItemLocation.create).not.toHaveBeenCalled(); // Karena tidak ada targetLocationId
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should register item without assigning location if current_stock is 0', async () => {
    const validData = { rfid_tag: '123', item_name: 'Item A', sku_code: 'SKU001', category: 'C', uom: 'PCS', current_stock: 0, location_id: 1 };
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({ id: 1, dataValues: { id: 1, ...validData } });

    const result = await registerItem(validData);

    expect(Item.create).toHaveBeenCalledWith(validData, { transaction: mockTransaction });
    expect(ItemLocation.create).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});
