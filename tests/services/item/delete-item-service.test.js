const deleteItem = require('../../../src/services/item/delete-item-service');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: delete-item-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if item not found', async () => {
    Item.findByPk.mockResolvedValue(null);
    await expect(deleteItem(999)).rejects.toThrow('Item not found');
  });

  it('should delete item if found', async () => {
    const mockItem = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
    Item.findByPk.mockResolvedValue(mockItem);

    const result = await deleteItem(1);

    expect(mockItem.destroy).toHaveBeenCalled();
    expect(result.message).toBe('Item deleted successfully');
  });
});
