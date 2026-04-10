const getReconciliationReport = require('../../../src/services/item/get-reconciliation-service');
const sequelize = require('../../../src/utils/database');

// Mock database and logger
jest.mock('../../../src/utils/database', () => ({
  query: jest.fn(),
  QueryTypes: {
    SELECT: 'SELECT'
  }
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Service: Reconciliation Coverage Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should cover success path of getReconciliationReport', async () => {
    const mockData = [{ item_id: 1, system_stock: 10 }];
    sequelize.query.mockResolvedValue(mockData);

    const result = await getReconciliationReport();

    expect(result).toEqual(mockData);
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining("item_id, sku_code, item_name"),
      { type: 'SELECT' }
    );
  });

  it('should cover error path of getReconciliationReport', async () => {
    const mockError = new Error('Database Error');
    sequelize.query.mockRejectedValue(mockError);

    await expect(getReconciliationReport()).rejects.toThrow('Database Error');
  });
});
