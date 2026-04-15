const finalizeOrderSync = require("../../../src/services/outbound/finalize-order-sync-service");
const { 
  Outbound, 
  OutboundItem, 
  StagingItem, 
  StagingSession, 
  StagingAuditLog, 
  Item, 
  ItemLocation, 
  InventoryMovement, 
  sequelize 
} = require("../../../src/models");
const { reconcileItemStock } = require("../../../src/utils/reconciliation");

jest.mock("../../../src/models", () => ({
  Outbound: { findByPk: jest.fn(), save: jest.fn() },
  OutboundItem: { findOne: jest.fn(), findAll: jest.fn() },
  StagingItem: { findAll: jest.fn(), update: jest.fn(), count: jest.fn() },
  StagingSession: { update: jest.fn() },
  StagingAuditLog: { create: jest.fn() },
  Item: { findOne: jest.fn(), findAll: jest.fn() },
  ItemLocation: { findOne: jest.fn() },
  InventoryMovement: { create: jest.fn() },
  sequelize: { transaction: jest.fn() }
}));

jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/reconciliation", () => ({
  reconcileItemStock: jest.fn(),
}));

describe("Service: finalizeOrderSync", () => {
  const mockOutboundId = 1;
  const mockUserId = 1;
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  it("should throw error if outbound order not found", async () => {
    Outbound.findByPk.mockResolvedValue(null);
    await expect(finalizeOrderSync(mockOutboundId, mockUserId)).rejects.toThrow("Outbound order not found");
  });

  it("should throw error if order is already DONE", async () => {
    Outbound.findByPk.mockResolvedValue({ id: 1, status: "DONE", items: [] });
    await expect(finalizeOrderSync(mockOutboundId, mockUserId)).rejects.toThrow("Order is already finalized");
  });

  it("should throw error if order is not 100% fulfilled", async () => {
    const mockOrder = {
      id: 1,
      status: "PROCES",
      items: [
        { sku_code: "SKU-1", qty_delivered: 5, qty_target: 10 }
      ]
    };
    Outbound.findByPk.mockResolvedValue(mockOrder);
    await expect(finalizeOrderSync(mockOutboundId, mockUserId)).rejects.toThrow(/not 100% fulfilled/);
  });

  it("should finalize order and associated staging data if 100% fulfilled", async () => {
    const mockOrder = {
      id: 1,
      order_number: "ORD-123",
      status: "PROCES",
      items: [
        { id: 10, sku_code: "SKU-1", qty_delivered: 10, qty_target: 10 }
      ],
      save: jest.fn(),
      toJSON: function() { return this; }
    };
    const mockStagingItem = {
      id: 100,
      staging_session_id: 55,
      rfid_tag: "RFID-1",
      location_id: 200,
      save: jest.fn()
    };
    const mockItem = { id: 77, sku_code: "SKU-1" };
    const mockItemLoc = { id: 300, stock: 10, save: jest.fn() };

    Outbound.findByPk.mockResolvedValue(mockOrder);
    StagingItem.findAll.mockResolvedValue([mockStagingItem]);
    StagingItem.count.mockResolvedValue(0);
    Item.findOne.mockResolvedValue(mockItem);
    ItemLocation.findOne.mockResolvedValue(mockItemLoc);

    Item.findAll.mockResolvedValue([{ id: 77 }]);

    const result = await finalizeOrderSync(mockOutboundId, mockUserId);

    expect(StagingItem.update).toHaveBeenCalledWith(
      { status: "FINALIZED" },
      expect.objectContaining({ 
        where: { id: expect.any(Array) } 
      })
    );
    expect(StagingSession.update).toHaveBeenCalledWith(
      { status: "FINALIZED" },
      expect.objectContaining({ where: { id: 55 } })
    );
    expect(mockOrder.status).toBe("DONE");
    expect(mockOrder.save).toHaveBeenCalled();
    expect(reconcileItemStock).toHaveBeenCalledWith(77, mockTransaction);
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.message).toContain("Order finalized and staging synchronized successfully");
  });

  it("should finalize order when no staging items are found (fulfilled manually)", async () => {
    const mockOrder = {
      id: 1,
      order_number: "ORD-123",
      status: "PROCES",
      items: [
        { id: 10, sku_code: "SKU-1", qty_delivered: 10, qty_target: 10 }
      ],
      save: jest.fn(),
      toJSON: function() { return this; }
    };
    Outbound.findByPk.mockResolvedValue(mockOrder);
    StagingItem.findAll.mockResolvedValue([]); // No staging items

    const result = await finalizeOrderSync(mockOutboundId, mockUserId);

    expect(mockOrder.status).toBe("DONE");
    expect(mockOrder.save).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result.message).toBe("Order finalized successfully");
  });

  it("should handle outbound with undefined items as empty list", async () => {
    const mockOrder = {
      id: 1,
      order_number: "ORD-EMPTY",
      status: "PROCES",
      items: undefined,
      save: jest.fn(),
    };
    Outbound.findByPk.mockResolvedValue(mockOrder);
    StagingItem.findAll.mockResolvedValue([]);

    const result = await finalizeOrderSync(mockOutboundId, mockUserId);
    expect(mockOrder.status).toBe("DONE");
    expect(result.order_number).toBe("ORD-EMPTY");
  });

  it("should not finalize staging session when there are remaining staged items", async () => {
    const mockOrder = {
      id: 1,
      order_number: "ORD-123",
      status: "PROCES",
      items: [{ id: 10, sku_code: "SKU-1", qty_delivered: 10, qty_target: 10 }],
      save: jest.fn(),
    };
    const mockStagingItem = {
      id: 100,
      staging_session_id: 55,
      rfid_tag: "RFID-1",
      outbound_item_id: 10
    };

    Outbound.findByPk.mockResolvedValue(mockOrder);
    StagingItem.findAll.mockResolvedValue([mockStagingItem]);
    StagingItem.count.mockResolvedValue(1);
    Item.findAll.mockResolvedValue([{ id: 77 }]);

    const result = await finalizeOrderSync(mockOutboundId, mockUserId);
    expect(StagingSession.update).not.toHaveBeenCalled();
    expect(StagingAuditLog.create).not.toHaveBeenCalled();
    expect(result.items_finalized).toBe(1);
  });

  it("should throw and skip rollback when transaction object is unavailable", async () => {
    sequelize.transaction.mockResolvedValueOnce(undefined);
    Outbound.findByPk.mockRejectedValueOnce(new Error("DB Error no tx"));

    await expect(finalizeOrderSync(mockOutboundId, mockUserId)).rejects.toThrow("DB Error no tx");
  });

  it("should handle transaction error in finalizeOrderSync", async () => {
    sequelize.transaction.mockRejectedValueOnce(new Error("Transaction fail"));
    await expect(finalizeOrderSync(mockOutboundId, mockUserId)).rejects.toThrow("Transaction fail");
  });

  it("should rollback transaction and throw error on failure", async () => {
    Outbound.findByPk.mockRejectedValue(new Error("DB Error"));
    await expect(finalizeOrderSync(mockOutboundId, mockUserId)).rejects.toThrow("DB Error");
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
