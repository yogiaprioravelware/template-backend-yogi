const { getInbounds } = require('../../../src/services/inbound/get-inbounds-service');
const Inbound = require('../../../src/models/Inbound');
const InboundItem = require('../../../src/models/InboundItem');

jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/utils/logger');

describe('Service: get-inbounds-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch inbounds and map item counts', async () => {
    Inbound.findAll.mockResolvedValue([
      { dataValues: { id: 1, po_number: 'PO1' } },
      { dataValues: { id: 2, po_number: 'PO2' } }
    ]);
    // PO1 has 5 items, PO2 has 0
    InboundItem.count.mockResolvedValueOnce(5).mockResolvedValueOnce(0);

    const result = await getInbounds();

    expect(result).toHaveLength(2);
    expect(result[0].item_count).toBe(5);
    expect(result[1].item_count).toBe(0);
  });
});
