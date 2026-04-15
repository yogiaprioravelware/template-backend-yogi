const createOutbound = require('../../../src/services/outbound/create-outbound-service');
const { Outbound, OutboundItem, Item, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Outbound: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  OutboundItem: {
    bulkCreate: jest.fn(),
  },
  Item: {
    findAll: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: create-outbound-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if Order already exists', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce({ id: 1 }); 

    await expect(createOutbound(validData)).rejects.toThrow('Order number already exists');
  });

  it('should throw error if SKU not found', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce(null);
    Item.findAll.mockResolvedValueOnce([]); // No SKUs found

    await expect(createOutbound(validData)).rejects.toThrow('The following SKU codes were not found: A');
  });

  it('should create outbound successfully', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce(null);
    Outbound.create.mockResolvedValue({ id: 2 });
    Item.findAll.mockResolvedValue([{ sku_code: 'A' }]); // SKU exists
    OutboundItem.bulkCreate.mockResolvedValue(true);

    const result = await createOutbound(validData);

    expect(Outbound.create).toHaveBeenCalledWith(
      expect.objectContaining({ order_number: 'ORD1' }),
      { transaction: mockTransaction }
    );
    expect(OutboundItem.bulkCreate).toHaveBeenCalled();
    expect(result.id).toBe(2);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should handle transaction error in createOutbound', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction fail'));
    await expect(createOutbound(validData)).rejects.toThrow('Transaction fail');
  });

  it('should handle error during Outbound.create', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    Outbound.findOne.mockResolvedValueOnce(null);
    Item.findAll.mockResolvedValue([{ sku_code: 'A' }]);
    Outbound.create.mockRejectedValueOnce(new Error('Create failed'));
    await expect(createOutbound(validData)).rejects.toThrow('Create failed');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    const validData = { order_number: 'ORD1', outbound_type: 'LUNAS', items: [{ sku_code: 'A', qty_target: 10 }] };
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Outbound.findOne.mockRejectedValueOnce(new Error('Lookup failed without tx'));

    await expect(createOutbound(validData)).rejects.toThrow('Lookup failed without tx');
  });
});
