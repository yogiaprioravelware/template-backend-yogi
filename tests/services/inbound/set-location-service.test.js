const { setLocation } = require('../../../src/services/inbound/set-location-service');
const Location = require('../../../src/models/Location');
const Inbound = require('../../../src/models/Inbound');

jest.mock('../../../src/models/Item');
jest.mock('../../../src/models/Location');
jest.mock('../../../src/models/Inbound');
jest.mock('../../../src/models/InboundItem');
jest.mock('../../../src/models/InboundReceivingLog');
jest.mock('../../../src/utils/logger');

describe('Service: set-location-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if location not found', async () => {
    Location.findOne.mockResolvedValue(null);
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Lokasi dengan QR code tidak ditemukan');
  });

  it('should return error if location is inactive', async () => {
    Location.findOne.mockResolvedValue({ status: 'INACTIVE' });
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Lokasi tidak aktif untuk penerimaan');
  });

  it('should return error if inbound not found', async () => {
    Location.findOne.mockResolvedValue({ status: 'ACTIVE' });
    Inbound.findByPk.mockResolvedValue(null);
    const result = await setLocation(1, 1, 'QR1');
    expect(result.success).toBe(false);
  });
});
