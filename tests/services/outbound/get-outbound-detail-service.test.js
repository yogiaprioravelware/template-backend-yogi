const getOutboundDetail = require('../../../src/services/outbound/get-outbound-detail-service');
const Outbound = require('../../../src/models/Outbound');
const OutboundItem = require('../../../src/models/OutboundItem');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: get-outbound-detail-service', () => {
  it('should throw error if outbound not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(getOutboundDetail(999)).rejects.toThrow('Outbound not found');
  });

  it('should retrieve detail and fallback missing item detail', async () => {
    Outbound.findByPk.mockResolvedValue({ dataValues: { id: 1 } });
    const mockOutboundItems = [
      { dataValues: { id: 10, sku_code: 'MISSING' } }
    ];
    OutboundItem.findAll.mockResolvedValue(mockOutboundItems);
    Item.findOne.mockResolvedValue(null);

    const result = await getOutboundDetail(1);
    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].item_name).toBe('');
    expect(result.items[0].current_stock).toBe(0);
  });
});
