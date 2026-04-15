const { getInbounds } = require('../../../src/services/inbound/get-inbounds-service');
const { Inbound, InboundItem, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Inbound: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  InboundItem: {
    findAll: jest.fn(),
  },
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: get-inbounds-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch inbounds and map item counts using eager loading', async () => {
    Inbound.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { 
          id: 1, 
          po_number: 'PO1', 
          status: 'PENDING',
          items: [
            { sku_code: 'A', qty_target: 10, qty_received: 2 },
            { sku_code: 'B', qty_target: 5, qty_received: 5 }
          ],
          toJSON: function() { return this; }
        },
        { 
          id: 2, 
          po_number: 'PO2', 
          status: 'DONE',
          items: [],
          toJSON: function() { return this; }
        }
      ]
    });

    InboundItem.findAll.mockResolvedValue([
      { inbound_id: 1, item_count: 2, total_qty_target: 15, total_qty_received: 7 }
    ]);

    const result = await getInbounds();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].item_count).toBe(2);
    expect(result.data[0].total_qty_target).toBe(15);
    expect(result.data[0].total_qty_received).toBe(7);
    expect(result.data[0].progress_percentage).toBe(47); // Math.round(7/15 * 100) = 46.67 -> 47
    expect(result.data[1].item_count).toBe(0);
    expect(result.data[1].progress_percentage).toBe(0);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.total).toBe(2);
  });

  it('should return empty data if count is 0', async () => {
    Inbound.findAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] });
    const result = await getInbounds();
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
