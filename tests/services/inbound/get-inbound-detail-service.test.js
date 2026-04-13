const { getInboundDetail } = require('../../../src/services/inbound/get-inbound-detail-service');
const Inbound = require('../../../src/models/Inbound');
const InboundItem = require('../../../src/models/InboundItem');
const Item = require('../../../src/models/Item');

jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/models/Item');
jest.mock('../../../src/utils/logger');

describe('Service: get-inbound-detail-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if inbound not found', async () => {
    Inbound.findByPk.mockResolvedValue(null);
    await expect(getInboundDetail(999)).rejects.toThrow('Inbound PO not found');
  });

  it('should return inbound details with items mapping', async () => {
    Inbound.findByPk.mockResolvedValue({ dataValues: { id: 1, po_number: 'PO1' } });
    InboundItem.findAll.mockResolvedValue([
      { id: 10, sku_code: 'SKU1', qty_target: 5 }
    ]);
    Item.findAll.mockResolvedValue([{
      sku_code: 'SKU1', item_name: 'Test', category: 'C1', uom: 'PCS'
    }]);

    const result = await getInboundDetail(1);

    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: 10, sku_code: 'SKU1', qty_target: 5, item_name: 'Test', category: 'C1', uom: 'PCS'
    });
  });
  it('should return inbound details with items mapping even if item detail is missing', async () => {
    Inbound.findByPk.mockResolvedValue({ dataValues: { id: 1, po_number: 'PO1' } });
    InboundItem.findAll.mockResolvedValue([
      { id: 10, sku_code: 'SKU_NONEXISTENT', qty_target: 5 }
    ]);
    Item.findAll.mockResolvedValue([]);

    const result = await getInboundDetail(1);

    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: 10, sku_code: 'SKU_NONEXISTENT', qty_target: 5, item_name: '', category: '', uom: ''
    });
  });
});
