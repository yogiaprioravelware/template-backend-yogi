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
  it('getItems should catch error', async () => {
    itemService.getItems.mockRejectedValue(new Error('error'));
    await itemController.getItems(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('getItemById should catch error', async () => {
    req.params.id = 1;
    itemService.getItemById.mockRejectedValue(new Error('error'));
    await itemController.getItemById(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('updateItem should catch error', async () => {
    req.params.id = 1;
    itemService.updateItem.mockRejectedValue(new Error('error'));
    await itemController.updateItem(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('deleteItem should catch error', async () => {
    req.params.id = 1;
    itemService.deleteItem.mockRejectedValue(new Error('error'));
    await itemController.deleteItem(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('setStockOpname should return success', async () => {
    req.user = { username: 'testuser' };
    itemService.setStockOpname.mockResolvedValue({});
    await itemController.setStockOpname(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('setStockOpname should work without user', async () => {
    req.user = undefined;
    itemService.setStockOpname.mockResolvedValue({});
    await itemController.setStockOpname(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('setStockOpname should catch error', async () => {
    itemService.setStockOpname.mockRejectedValue(new Error('error'));
    await itemController.setStockOpname(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('getItemHistory should return success', async () => {
    itemService.getItemHistory.mockResolvedValue([]);
    await itemController.getItemHistory(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('getItemHistory should catch error', async () => {
    itemService.getItemHistory.mockRejectedValue(new Error('error'));
    await itemController.getItemHistory(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('getReconciliation should return success', async () => {
    itemService.getReconciliationReport.mockResolvedValue([]);
    await itemController.getReconciliation(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('getReconciliation should catch error', async () => {
    itemService.getReconciliationReport.mockRejectedValue(new Error('error'));
    await itemController.getReconciliation(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});