const getOutbounds = require('../../../src/services/outbound/get-outbounds-service');
const Outbound = require('../../../src/models/Outbound');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/utils/logger');

describe('Service: get-outbounds-service', () => {
  it('should retrieve all outbounds', async () => {
    Outbound.findAll.mockResolvedValue([]);
    const result = await getOutbounds();
    expect(result).toEqual([]);
  });
});
