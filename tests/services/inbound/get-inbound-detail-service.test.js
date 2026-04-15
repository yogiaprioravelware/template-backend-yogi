const { getInboundDetail } = require('../../../src/services/inbound/get-inbound-detail-service');
const { Inbound } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Inbound: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: get-inbound-detail-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if inbound not found', async () => {
    Inbound.findByPk.mockResolvedValue(null);
    await expect(getInboundDetail(999)).rejects.toThrow('Inbound PO not found');
  });

  it('should return inbound details with items mapping', async () => {
    const mockInbound = {
      id: 1,
      po_number: 'PO1',
      items: [
        {
          id: 10,
          sku_code: 'SKU1',
          qty_target: 5,
          qty_received: 2,
          metadata: {
            item_name: 'Test',
            category: 'C1',
            uom: 'PCS'
          }
        }
      ],
      toJSON: function() { return this; }
    };
    Inbound.findByPk.mockResolvedValue(mockInbound);

    const result = await getInboundDetail(1);

    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(expect.objectContaining({
      id: 10,
      sku_code: 'SKU1',
      qty_target: 5,
      item_name: 'Test'
    }));
  });

  it('should return inbound details even if metadata is missing', async () => {
    const mockInbound = {
      id: 1,
      po_number: 'PO1',
      items: [
        {
          id: 10,
          sku_code: 'SKU_UNKNOWN',
          qty_target: 5,
          qty_received: 0,
          metadata: null
        }
      ],
      toJSON: function() { return this; }
    };
    Inbound.findByPk.mockResolvedValue(mockInbound);

    const result = await getInboundDetail(1);

    expect(result.id).toBe(1);
    expect(result.items[0].item_name).toBe('');
  });
});
