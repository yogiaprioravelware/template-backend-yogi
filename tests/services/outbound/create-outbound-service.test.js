const createOutbound = require('../../../src/services/outbound/create-outbound-service');
const Outbound = require('../../../src/models/Outbound');
const OutboundItem = require('../../../src/models/OutboundItem');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Outbound');
jest.mock('../../../src/models/OutboundItem');
jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: create-outbound-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if validation fails', async () => {
    const invalidData = { order_number: 'ORD1' }; 
    await expect(createOutbound(invalidData)).rejects.toThrow();
  });

  it('should throw error if Order already exists', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce({ id: 1 }); 

    await expect(createOutbound(validData)).rejects.toThrow('Order number already exists');
  });

  it('should throw error if SKU not found', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce(null);
    Outbound.create.mockResolvedValue({ id: 2 });
    Item.findOne.mockResolvedValueOnce(null); 

    await expect(createOutbound(validData)).rejects.toThrow('SKU code A not found in items');
  });

  it('should create outbound successfully', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce(null);
    Outbound.create.mockResolvedValue({ id: 2 });
    Item.findOne.mockResolvedValue({ id: 1 });
    OutboundItem.create.mockResolvedValue(true);

    const result = await createOutbound(validData);

    expect(Outbound.create).toHaveBeenCalled();
    expect(OutboundItem.create).toHaveBeenCalled();
    expect(result.id).toBe(2);
  });
});
