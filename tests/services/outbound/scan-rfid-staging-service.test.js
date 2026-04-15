const { scanRfidStaging } = require('../../../src/services/outbound/scan-rfid-staging-service');
const { OutboundLog, sequelize } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  OutboundLog: {
    findOne: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger');

describe('Service: scan-rfid-staging-service', () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if RFID tag not in PICKED status', async () => {
    OutboundLog.findOne.mockResolvedValue(null);
    await expect(scanRfidStaging('RFID1'))
      .rejects.toThrow("RFID tag not in PICKED status or not found for any active outbound order");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('should handle error when transaction creation fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction Fail'));
    await expect(scanRfidStaging('RFID1')).rejects.toThrow('Transaction Fail');
  });

  it('should successfully stage item', async () => {
    const mockLog = { id: 30, status: 'PICKED', save: jest.fn() };
    OutboundLog.findOne.mockResolvedValue(mockLog);

    const result = await scanRfidStaging('RFID1');

    expect(mockLog.status).toBe('STAGED');
    expect(mockLog.staging_time).toBeDefined();
    expect(mockLog.save).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.status).toBe('STAGED');
  });

  it('should rollback transaction on error', async () => {
    OutboundLog.findOne.mockRejectedValue(new Error('DB Error'));
    await expect(scanRfidStaging('RFID1')).rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});