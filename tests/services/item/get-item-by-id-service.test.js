const getItemById = require('../../../src/services/item/get-item-by-id-service');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: get-item-by-id-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if item not found', async () => {
    Item.findByPk.mockResolvedValue(null);
    await expect(getItemById(999)).rejects.toThrow('Item not found');
  });

  it('should return item if found', async () => {
    const mockItem = { id: 1, sku_code: 'SKU1' };
    Item.findByPk.mockResolvedValue(mockItem);

    const result = await getItemById(1);

    expect(result).toEqual(mockItem);
    expect(Item.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
      include: expect.any(Array)
    }));
  });
});
