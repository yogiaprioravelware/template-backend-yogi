const { handleAutomatedStaging } = require("../../../src/services/staging/automated-staging-service");
const { StagingSession, StagingItem, StagingAuditLog, sequelize } = require("../../../src/models");

jest.mock("../../../src/models", () => ({
  StagingSession: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  StagingItem: {
    create: jest.fn(),
  },
  StagingAuditLog: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
  Op: {
    like: Symbol('like'),
  },
}));

jest.mock("../../../src/utils/logger");

describe("Service: handleAutomatedStaging", () => {
  const mockRfid = "RFID-AUTO-123";
  const mockOutboundId = 10;
  const mockLocId = 5;
  const mockUserId = 1;
  const mockOutboundItemId = 100;
  const mockTransaction = {};

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new session if no open session exists for the order", async () => {
    StagingSession.findOne.mockResolvedValue(null);
    StagingSession.create.mockResolvedValue({ id: 99 });
    StagingItem.create.mockResolvedValue({ id: 500 });

    const result = await handleAutomatedStaging(
      mockRfid,
      mockOutboundId,
      mockLocId,
      mockUserId,
      mockTransaction,
      mockOutboundItemId
    );

    expect(StagingSession.create).toHaveBeenCalled();
    expect(StagingAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "AUTO_CREATE" }),
      expect.anything()
    );
    expect(StagingItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        staging_session_id: 99,
        rfid_tag: mockRfid,
        outbound_item_id: mockOutboundItemId
      }),
      expect.anything()
    );
    expect(result.id).toBe(500);
  });

  it("should reuse an existing open session if found", async () => {
    StagingSession.findOne.mockResolvedValue({ id: 88, session_number: "EXISTING-SESS" });
    StagingItem.create.mockResolvedValue({ id: 501 });

    const result = await handleAutomatedStaging(
      mockRfid,
      mockOutboundId,
      mockLocId,
      mockUserId,
      mockTransaction,
      mockOutboundItemId
    );

    expect(StagingSession.create).not.toHaveBeenCalled();
    expect(StagingItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ staging_session_id: 88 }),
      expect.anything()
    );
    expect(result.id).toBe(501);
  });
});
