const getOutbounds = require('../../../src/services/outbound/get-outbounds-service');
const { Outbound, OutboundItem, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Outbound: {
    findAndCountAll: jest.fn(),
  },
  OutboundItem: {
    findAll: jest.fn(),
  },
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: get-outbounds-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve all outbounds and append item_count', async () => {
    Outbound.findAndCountAll.mockResolvedValue({
      count: 3,
      rows: [
        { id: 1, order_number: 'ORD1', toJSON: function() { return this; } },
        { id: 2, order_number: 'ORD2', toJSON: function() { return this; } },
        { id: 3, order_number: 'ORD3', toJSON: function() { return this; } }
      ]
    });

    OutboundItem.findAll.mockResolvedValue([
      { outbound_id: 1, item_count: 2, total_qty_target: 20, total_qty_delivered: 5 },
      { outbound_id: 2, item_count: 0, total_qty_target: 0, total_qty_delivered: 0 }
    ]);

    const result = await getOutbounds();
    
    expect(result.data).toHaveLength(3);
    expect(result.data[0].item_count).toBe(2);
    expect(result.data[2].item_count).toBe(0); 
    expect(result.data[2].progress_percentage).toBe(0);
    expect(result.pagination).toBeDefined();
  });

  it('should return empty data if count is 0', async () => {
    Outbound.findAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] });
    const result = await getOutbounds();
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
