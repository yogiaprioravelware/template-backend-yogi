const finalizeSession = require("../../../src/services/staging/finalize-session-service");
const { 
  StagingSession, 
  StagingItem, 
  StagingAuditLog, 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  InventoryMovement, 
  sequelize 
} = require("../../../src/models");
const { reconcileItemStock } = require("../../../src/utils/reconciliation");

jest.mock("../../../src/models", () => ({
  StagingSession: {
    findByPk: jest.fn(),
  },
  StagingItem: {
    findAll: jest.fn(),
  },
  StagingAuditLog: {
    create: jest.fn(),
  },
  Outbound: {
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  OutboundItem: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  Item: {
    findOne: jest.fn(),
  },
  ItemLocation: {
    findOne: jest.fn(),
  },
  InventoryMovement: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/reconciliation", () => ({
  reconcileItemStock: jest.fn(),
}));

describe("Service: finalizeSession", () => {
  const mockSessionId = 1;
  const mockUserId = 1;
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
    jest.clearAllMocks();
  });

  it("should throw error if session not found or not OPEN", async () => {
    StagingSession.findByPk.mockResolvedValue(null);
    await expect(finalizeSession(mockSessionId, mockUserId)).rejects.toThrow("Staging session not found or already finalized");
  });

  it("should throw error if no items in staging", async () => {
    StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
    StagingItem.findAll.mockResolvedValue([]);
    await expect(finalizeSession(mockSessionId, mockUserId)).rejects.toThrow("No items in staging to finalize");
  });

  it("should finalize session and update inventory", async () => {
    const mockSession = { id: 1, session_number: "STG-001", status: "OPEN", save: jest.fn() };
    const mockStagingItem = { 
      id: 10, 
      rfid_tag: "RFID-1", 
      location_id: 100, 
      outbound_item_id: 50,
      save: jest.fn() 
    };
    const mockObItem = { id: 50, outbound_id: 5, qty_delivered: 0, qty_target: 1, save: jest.fn() };
    const mockItem = { id: 77, sku_code: "SKU-1" };
    const mockItemLoc = { id: 300, stock: 5, save: jest.fn() };

    StagingSession.findByPk.mockResolvedValue(mockSession);
    StagingItem.findAll.mockResolvedValue([mockStagingItem]);
    OutboundItem.findByPk.mockResolvedValue(mockObItem);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);
    OutboundItem.findAll.mockResolvedValue([mockObItem]);
    Outbound.findByPk.mockResolvedValue({ id: 5, order_number: "ORD-1" });

    const result = await finalizeSession(mockSessionId, mockUserId);

    expect(mockStagingItem.status).toBe("FINALIZED");
    expect(mockObItem.qty_delivered).toBe(1);
    expect(mockSession.status).toBe("FINALIZED");
    expect(reconcileItemStock).toHaveBeenCalledWith(77, mockTransaction);
    expect(result.message).toContain("successfully");
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it("should throw error if item not found", async () => {
    const mockSession = { id: 1, session_number: "STG-001", status: "OPEN", save: jest.fn() };
    const mockStagingItem = { id: 10, rfid_tag: "RFID-MISSING", outbound_item_id: 50, save: jest.fn() };
    const mockObItem = { id: 50, outbound_id: 5, qty_delivered: 0, save: jest.fn() };

    StagingSession.findByPk.mockResolvedValue(mockSession);
    StagingItem.findAll.mockResolvedValue([mockStagingItem]);
    OutboundItem.findByPk.mockResolvedValue(mockObItem);
    Item.findOne.mockResolvedValue(null); 

    await expect(finalizeSession(mockSessionId, mockUserId)).rejects.toThrow(/Item with RFID/);
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
