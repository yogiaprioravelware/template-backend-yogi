const getItemHistory = require('../../../src/services/item/get-item-history-service');
const Item = require('../../../src/models/Item');
const InventoryMovement = require('../../../src/models/InventoryMovement');

jest.mock('../../../src/models/Item', () => {
  const SequelizeModel = class {};
  SequelizeModel.findByPk = jest.fn();
  SequelizeModel.hasMany = jest.fn();
  SequelizeModel.belongsToMany = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/models/InventoryMovement', () => {
  const SequelizeModel = class {};
  SequelizeModel.findAll = jest.fn();
  SequelizeModel.belongsTo = jest.fn();
  return SequelizeModel;
});
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/models/Location', () => {
  const SequelizeModel = class {};
  return SequelizeModel;
});

describe('Service: get-item-history-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if item not found', async () => {
    Item.findByPk.mockResolvedValue(null);
    await expect(getItemHistory(1)).rejects.toThrow("Item not found");
  });

  it('should return movements successfully', async () => {
    Item.findByPk.mockResolvedValue({ id: 1 });
    InventoryMovement.findAll.mockResolvedValue([
      { id: 10, type: 'INBOUND', qty_change: +20 }
    ]);

    const result = await getItemHistory(1);
    expect(result.length).toBe(1);
    expect(result[0].qty_change).toBe(20);
    expect(InventoryMovement.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { item_id: 1 }
    }));
  });
});
