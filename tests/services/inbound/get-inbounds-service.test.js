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
      { id: 1, po_number: 'PO1' },
      { id: 2, po_number: 'PO2' },
      { id: 3, po_number: 'PO3' }
    ]);
    InboundItem.findAll.mockResolvedValue([
      { inbound_id: 1, item_count: 5, total_qty_target: 10, total_qty_received: 2 },
      { inbound_id: 2, item_count: 0, total_qty_target: 0, total_qty_received: 0 }
    ]);

    const result = await getInbounds();

    expect(result).toHaveLength(3);
    expect(result[0].item_count).toBe(5);
    expect(result[1].item_count).toBe(0);
    expect(result[2].item_count).toBe(0); // Branch || {} hit
    expect(result[2].progress_percentage).toBe(0);
  });
});
