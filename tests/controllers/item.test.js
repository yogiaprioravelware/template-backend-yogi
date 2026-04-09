const itemController = require('../../src/controllers/item');
const itemService = require('../../src/services/item');
const response = require('../../src/utils/response');

jest.mock('../../src/services/item');
jest.mock('../../src/utils/logger');

describe('Controller: item', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('registerItem should return 201', async () => {
    itemService.registerItem.mockResolvedValue({ id: 1 });
    await itemController.registerItem(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registerItem should catch error', async () => {
    itemService.registerItem.mockRejectedValue(new Error('error'));
    await itemController.registerItem(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('getItems should return items', async () => {
    itemService.getItems.mockResolvedValue([]);
    await itemController.getItems(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('getItemById should return item', async () => {
    itemService.getItemById.mockResolvedValue({});
    await itemController.getItemById(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('updateItem should return updated item', async () => {
    itemService.updateItem.mockResolvedValue({});
    await itemController.updateItem(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('deleteItem should return success', async () => {
    itemService.deleteItem.mockResolvedValue({});
    await itemController.deleteItem(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });
});
