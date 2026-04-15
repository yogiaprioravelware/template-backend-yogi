const { finalizeInbound } = require("../../../src/services/inbound/finalize-inbound-service");
const { Inbound, InboundItem, InboundLog, Item, sequelize } = require("../../../src/models");
const { reconcileItemStock } = require("../../../src/utils/reconciliation");
const logger = require("../../../src/utils/logger");

jest.mock("../../../src/models", () => ({
  Inbound: {
    findByPk: jest.fn(),
  },
  InboundItem: {},
  InboundLog: {
    findAll: jest.fn(),
  },
  Item: {
    findAll: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock("../../../src/utils/reconciliation", () => ({
  reconcileItemStock: jest.fn(),
}));

jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Service: finalize-inbound-service", () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw 404 error if Inbound PO is not found", async () => {
    Inbound.findByPk.mockResolvedValue(null);

    await expect(finalizeInbound(1, 1)).rejects.toThrow("Inbound PO not found");
    expect(Inbound.findByPk).toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should throw 400 error if Inbound PO is already DONE", async () => {
    const mockInbound = { status: "DONE" };
    Inbound.findByPk.mockResolvedValue(mockInbound);

    await expect(finalizeInbound(1, 1)).rejects.toThrow("Inbound PO is already finalized (DONE)");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should throw 400 error if no items in STORED status", async () => {
    const mockInbound = { status: "PROCESS" };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    InboundLog.findAll.mockResolvedValue([]);

    await expect(finalizeInbound(1, 1)).rejects.toThrow("No items in STORED status. Please scan items to rack first.");
    expect(InboundLog.findAll).toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should successfully finalize inbound PO and reconcile stock", async () => {
    const mockInbound = {
      id: 1,
      po_number: "PO-001",
      status: "PROCESS",
      items: [
        { sku_code: "SKU-A", qty_target: 10, qty_received: 5 },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    Inbound.findByPk.mockResolvedValue(mockInbound);

    const mockLogs = [
      { id: 101, rfid_tag: "RFID-A1", status: "STORED", save: jest.fn().mockResolvedValue(true) },
      { id: 102, rfid_tag: "RFID-A2", status: "STORED", save: jest.fn().mockResolvedValue(true) },
    ];
    InboundLog.findAll.mockResolvedValue(mockLogs);

    const mockItems = [
      { id: 10, rfid_tag: "RFID-A1" },
      { id: 10, rfid_tag: "RFID-A2" }, // Same item ID for different tags (unlikely in reality but possible in mock)
    ];
    Item.findAll.mockResolvedValue(mockItems);

    reconcileItemStock.mockResolvedValue(10);

    const result = await finalizeInbound(1, 1);

    expect(mockLogs[0].status).toBe("FINALIZED");
    expect(mockLogs[1].status).toBe("FINALIZED");
    expect(mockLogs[0].save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockLogs[1].save).toHaveBeenCalledWith({ transaction: mockTransaction });
    
    expect(mockInbound.status).toBe("DONE");
    expect(mockInbound.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    
    expect(reconcileItemStock).toHaveBeenCalledWith(10, mockTransaction);
    expect(mockTransaction.commit).toHaveBeenCalled();
    
    expect(result).toHaveProperty("message", "Inbound PO finalized successfully");
    expect(result).toHaveProperty("po_number", "PO-001");
    expect(result.items_processed).toBe(2);
  });

  it("should handle error during finalization and rollback", async () => {
    const mockInbound = { status: "PROCESS" };
    Inbound.findByPk.mockResolvedValue(mockInbound);
    InboundLog.findAll.mockRejectedValue(new Error("Database connection lost"));

    await expect(finalizeInbound(1, 1)).rejects.toThrow("Database connection lost");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should skip rollback if transaction fails to initialize", async () => {
    sequelize.transaction.mockRejectedValue(new Error("Transaction error"));
    await expect(finalizeInbound(1, 1)).rejects.toThrow("Transaction error");
  });
});
