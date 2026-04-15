const { createInbound } = require('../../../src/services/inbound/create-inbound-service');
const { Inbound, InboundItem, Item, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Inbound: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  InboundItem: {
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

describe('Service: create-inbound-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    expect(Inbound.create).toHaveBeenCalledWith({ po_number: 'PO1', status: 'PENDING' }, { transaction: mockTransaction });
    expect(InboundItem.bulkCreate).toHaveBeenCalledWith([{
      inbound_id: 2,
      sku_code: 'A',
      qty_target: 10,
      qty_received: 0
    }], { transaction: mockTransaction });
    expect(result).toEqual(mockInbound);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should handle transaction error during Inbound.create', async () => {
    const validData = { po_number: 'PO1', items: [{ sku_code: 'A', qty_target: 10 }] };
    Inbound.findOne.mockResolvedValueOnce(null);
    Item.findAll.mockResolvedValue([{ sku_code: 'A' }]);
    Inbound.create.mockRejectedValueOnce(new Error('Create failed'));
    await expect(createInbound(validData)).rejects.toThrow('Create failed');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle transaction error', async () => {
    const validData = { po_number: 'PO1', items: [{ sku_code: 'A', qty_target: 10 }] };
    sequelize.transaction.mockRejectedValueOnce(new Error('Transaction failed'));
    await expect(createInbound(validData)).rejects.toThrow('Transaction failed');
  });

  it('should throw and skip rollback if transaction object is unavailable', async () => {
    const validData = { po_number: 'PO1', items: [{ sku_code: 'A', qty_target: 10 }] };
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Inbound.findOne.mockRejectedValueOnce(new Error('Lookup failed'));

    await expect(createInbound(validData)).rejects.toThrow('Lookup failed');
  });
});
