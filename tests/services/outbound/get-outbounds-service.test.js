const getOutbounds = require('../../../src/services/outbound/get-outbounds-service');
const Outbound = require('../../../src/models/Outbound');
const OutboundItem = require('../../../src/models/OutboundItem');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/utils/logger');

describe('Service: get-outbounds-service', () => {
  it('should retrieve all outbounds', async () => {
    Outbound.findAll.mockResolvedValue([]);
    const result = await getOutbounds();
    expect(result).toEqual([]);
  });

  it('should retrieve all outbounds and append item_count', async () => {
    Outbound.findAll.mockResolvedValue([
      { dataValues: { id: 1, order_number: 'ORD1' } },
      { dataValues: { id: 2, order_number: 'ORD2' } }
    ]);
    OutboundItem.count.mockResolvedValue(2);
    OutboundItem.sum.mockResolvedValueOnce(20).mockResolvedValueOnce(5); // target 20, delivered 5

    const result = await getOutbounds();
    expect(result).toHaveLength(2);
    expect(result[0].item_count).toBe(2);
    expect(result[0].total_qty_target).toBe(20);
    expect(result[0].total_qty_delivered).toBe(5);
    expect(result[0].progress_percentage).toBe(25);
  });
});
