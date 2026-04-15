const getItems = require('../../../src/services/item/get-items-service');
const { Item } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Item: { findAndCountAll: jest.fn() }
}));

jest.mock('../../../src/utils/logger');

describe('Service: get-items-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all items with default pagination', async () => {
    Item.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await getItems();
    expect(Item.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  it('should return items with specific pagination', async () => {
    const mockItems = [
      { id: 1, sku_code: 'SKU1', item_name: 'Item 1' },
      { id: 2, sku_code: 'SKU2', item_name: 'Item 2' }
    ];
    Item.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: mockItems
    });

    const result = await getItems({ page: 1, limit: 10 });

    expect(result.data).toEqual(mockItems);
    expect(result.pagination.total).toBe(2);
    expect(Item.findAndCountAll).toHaveBeenCalled();
  });
});
