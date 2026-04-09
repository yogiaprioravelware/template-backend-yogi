const getItems = require('../../../src/services/item/get-items-service');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: get-items-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all items', async () => {
    const mockItems = [{ id: 1, sku_code: 'SKU1' }];
    Item.findAll.mockResolvedValue(mockItems);

    const result = await getItems();

    expect(result).toEqual(mockItems);
    expect(Item.findAll).toHaveBeenCalled();
  });
});
