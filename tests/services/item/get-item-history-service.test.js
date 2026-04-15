const getItemHistory = require('../../../src/services/item/get-item-history-service');
const { Item, InventoryMovement } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: {
    findByPk: jest.fn(),
  },
  InventoryMovement: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

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
      { id: 10, type: 'INBOUND', qty_change: 20 }
    ]);

    const result = await getItemHistory(1);
    expect(result.length).toBe(1);
    expect(result[0].qty_change).toBe(20);
    expect(InventoryMovement.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { item_id: 1 }
    }));
  });
});
