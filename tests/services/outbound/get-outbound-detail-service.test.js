const getOutboundDetail = require('../../../src/services/outbound/get-outbound-detail-service');
const { Outbound, OutboundItem, Item } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Outbound: { findByPk: jest.fn() },
  OutboundItem: { findAll: jest.fn() },
  Item: { findOne: jest.fn() }
}));

jest.mock('../../../src/utils/logger');

describe('Service: get-outbound-detail-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if outbound not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(getOutboundDetail(999)).rejects.toThrow('Outbound not found');
  });

  it('should retrieve detail and fallback missing item detail', async () => {
    const mockOutbound = {
      id: 1,
      order_number: 'ORD-001',
      toJSON: () => ({
        id: 1,
        order_number: 'ORD-001',
        items: [
          { id: 10, sku_code: 'SKU1', qty_target: 10, qty_delivered: 5, metadata: null }
        ]
      })
    };
    Outbound.findByPk.mockResolvedValue(mockOutbound);

    const result = await getOutboundDetail(1);

    expect(result.order_number).toBe('ORD-001');
    expect(result.items[0].item_name).toBe("");
    expect(result.progress_percentage).toBe(50);
  });

  it('should retrieve detail and map item metadata successfully', async () => {
    const mockOutbound = {
      id: 2,
      order_number: 'ORD-002',
      toJSON: () => ({
        id: 2,
        order_number: 'ORD-002',
        items: [
          { 
            id: 20, 
            sku_code: 'SKU2', 
            qty_target: 20, 
            qty_delivered: 20, 
            metadata: { item_name: 'Product 2', category: 'Cat 2', uom: 'PCS', current_stock: 100 } 
          }
        ]
      })
    };
    Outbound.findByPk.mockResolvedValue(mockOutbound);

    const result = await getOutboundDetail(2);

    expect(result.order_number).toBe('ORD-002');
    expect(result.items[0].item_name).toBe('Product 2');
    expect(result.progress_percentage).toBe(100);
  });

  it('should handle partial metadata and items with existing delivery qty', async () => {
    const mockOutbound = {
      id: 3,
      order_number: 'ORD-003',
      toJSON: () => ({
        id: 3,
        order_number: 'ORD-003',
        items: [
          { 
            id: 30, 
            sku_code: 'SKU3', 
            qty_target: 10, 
            qty_delivered: 2, 
            metadata: { item_name: 'Product 3' } 
          }
        ]
      })
    };
    Outbound.findByPk.mockResolvedValue(mockOutbound);

    const result = await getOutboundDetail(3);

    expect(result.items[0].qty_delivered).toBe(2);
    expect(result.progress_percentage).toBe(20);
  });

  it('should handle items with null qty_target/qty_delivered', async () => {
    const mockOutbound = {
      id: 4,
      toJSON: () => ({
        id: 4,
        items: [{ id: 40, sku_code: 'SKU4', qty_target: null, qty_delivered: null, metadata: { item_name: 'Product 4' } }]
      })
    };
    Outbound.findByPk.mockResolvedValue(mockOutbound);

    const result = await getOutboundDetail(4);

    expect(result.items[0].qty_target).toBe(0);
    expect(result.items[0].qty_delivered).toBe(0);
  });

  it('should handle outbound with no items (edge case for 100% branch coverage)', async () => {
    const mockOutbound = {
      id: 5,
      toJSON: () => ({ id: 5, items: [] })
    };
    Outbound.findByPk.mockResolvedValue(mockOutbound);

    const result = await getOutboundDetail(5);

    expect(result.items).toHaveLength(0);
    expect(result.progress_percentage).toBe(0);
  });
});
