const { createInbound } = require('../../../src/services/inbound/create-inbound-service');
const Inbound = require('../../../src/models/Inbound');
const InboundItem = require('../../../src/models/InboundItem');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: create-inbound-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    const invalidData = { po_number: 'PO1' }; // missing items
    await expect(createInbound(invalidData)).rejects.toThrow();
  });

  it('should throw error if PO already exists', async () => {
    const validData = { po_number: 'PO1', items: [{ sku_code: 'A', qty_target: 10 }] };
    Inbound.findOne.mockResolvedValueOnce({ id: 1 }); // PO exists

    await expect(createInbound(validData)).rejects.toThrow('PO number already exists');
  });

  it('should throw error if a SKU is not found', async () => {
    const validData = { po_number: 'PO1', items: [{ sku_code: 'A', qty_target: 10 }] };
    Inbound.findOne.mockResolvedValueOnce(null);
    Item.findAll.mockResolvedValueOnce([]); // No SKUs found

    await expect(createInbound(validData)).rejects.toThrow('The following SKU codes were not found: A');
  });

  it('should create inbound header and detail successfully', async () => {
    const validData = { po_number: 'PO1', items: [{ sku_code: 'A', qty_target: 10 }] };
    Inbound.findOne.mockResolvedValueOnce(null);
    const mockInbound = { id: 2 };
    Inbound.create.mockResolvedValue(mockInbound);
    Item.findAll.mockResolvedValue([{ sku_code: 'A' }]); // SKU exists
    InboundItem.bulkCreate.mockResolvedValue(true);

    const result = await createInbound(validData);

    expect(Inbound.create).toHaveBeenCalledWith({ po_number: 'PO1', status: 'PENDING' });
    expect(InboundItem.bulkCreate).toHaveBeenCalledWith([{
      inbound_id: 2,
      sku_code: 'A',
      qty_target: 10,
      qty_received: 0
    }]);
    expect(result).toEqual(mockInbound);
  });
});
