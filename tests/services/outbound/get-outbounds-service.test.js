const getOutbounds = require('../../../src/services/outbound/get-outbounds-service');
const Outbound = require('../../../src/models/Outbound');
const OutboundItem = require('../../../src/models/OutboundItem');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/utils/logger');

describe('Service: get-outbounds-service', () => {
  it('should retrieve all outbounds', async () => {
    Outbound.findAll.mockResolvedValue([]);
    OutboundItem.findAll.mockResolvedValue([]);
    const result = await getOutbounds();
    expect(result).toEqual([]);
  });

  it('should retrieve all outbounds and append item_count', async () => {
    Outbound.findAll.mockResolvedValue([
      { id: 1, order_number: 'ORD1' },
      { id: 2, order_number: 'ORD2' },
      { id: 3, order_number: 'ORD3' }
    ]);
    OutboundItem.findAll.mockResolvedValue([
      { outbound_id: 1, item_count: 2, total_qty_target: 20, total_qty_delivered: 5 },
      { outbound_id: 2, item_count: 0, total_qty_target: 0, total_qty_delivered: 0 }
    ]);

    const result = await getOutbounds();
    expect(result).toHaveLength(3);
    expect(result[0].item_count).toBe(2);
    expect(result[2].item_count).toBe(0); // Branch || {} hit
    expect(result[2].progress_percentage).toBe(0);
  });
});
