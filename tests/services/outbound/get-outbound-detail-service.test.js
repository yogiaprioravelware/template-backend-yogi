const getOutboundDetail = require('../../../src/services/outbound/get-outbound-detail-service');
const Outbound = require('../../../src/models/Outbound');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: get-outbound-detail-service', () => {
  it('should throw error if outbound not found', async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(getOutboundDetail(999)).rejects.toThrow('Outbound not found');
  });
});
