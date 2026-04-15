const { 
  StagingSession, 
  StagingItem, 
  StagingAuditLog, 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  InventoryMovement, 
   Location, 
   User, 
   sequelize 
 } = require('../../../src/models');
 const mockInventoryMovement = InventoryMovement;
const createSession = require("../../../src/services/staging/create-session-service");
const { getSessionDetail } = require("../../../src/services/staging/get-session-detail-service");
const finalizeSession = require("../../../src/services/staging/finalize-session-service");








const { reconcileItemStock } = require("../../../src/utils/reconciliation");

jest.mock('../../../src/models', () => ({
  StagingSession: { findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), update: jest.fn() },
  StagingItem: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  StagingAuditLog: { create: jest.fn(), findAll: jest.fn() },
  Outbound: { findByPk: jest.fn(), update: jest.fn() },
  OutboundItem: { findByPk: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
  Item: { findOne: jest.fn() },
  ItemLocation: { findOne: jest.fn() },
  InventoryMovement: { create: jest.fn() },
  Location: { findOne: jest.fn(), findByPk: jest.fn() },
  User: { findByPk: jest.fn() },
  sequelize: { transaction: jest.fn(), col: jest.fn() },
  Op: {
    lt: Symbol('lt'),
    in: Symbol('in'),
    like: Symbol('like')
  }
}));
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/reconciliation");

describe("Staging Services: Comprehensive Testing", () => {
  const mockUserId = 1;
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe("createSession", () => {
    it("should create a new session successfully", async () => {
      StagingSession.findOne.mockResolvedValue(null);
      StagingSession.create.mockResolvedValue({ id: 6, session_number: "S-00006" });

      const result = await createSession({ session_number: "S-00006" }, mockUserId);

      expect(StagingSession.create).toHaveBeenCalled();
      expect(StagingAuditLog.create).toHaveBeenCalled();
      expect(result.session_number).toBe("S-00006");
    });

    it("should throw error if session number already exists", async () => {
      StagingSession.findOne.mockResolvedValue({ id: 5 });
      await expect(createSession({ session_number: "S-EXIST" }, mockUserId)).rejects.toThrow("Session number already exists");
    });

    it("should rollback transaction on error", async () => {
      StagingSession.findOne.mockRejectedValue(new Error("DB Error"));
      await expect(createSession({ session_number: "S-FAIL" }, mockUserId)).rejects.toThrow("DB Error");
    });

    it("should handle error before transaction is created", async () => {
      sequelize.transaction.mockRejectedValueOnce(new Error("Transaction Fail"));
      await expect(createSession({ session_number: "S-FAIL" }, mockUserId)).rejects.toThrow("Transaction Fail");
    });

    it("should throw and skip rollback when transaction object is unavailable", async () => {
      sequelize.transaction.mockResolvedValueOnce(undefined);
      StagingSession.findOne.mockRejectedValueOnce(new Error("Create session without tx"));

      await expect(createSession({ session_number: "S-NO-TX" }, mockUserId)).rejects.toThrow("Create session without tx");
    });
  });

  describe("getSessionDetail", () => {
    it("should throw error if session not found", async () => {
      StagingSession.findByPk.mockResolvedValue(null);
      await expect(getSessionDetail(10)).rejects.toThrow("Staging session not found");
    });

    it("should return formatted detail with items and logs", async () => {
      const mockSession = { 
        id: 1, 
        session_number: "S-1", 
        status: "OPEN",
        items: [
          { rfid_tag: "R1", outbound_item: { outbound: { order_number: "ORD1" } }, location: { location_code: "LOC1" } }
        ]
      };
      StagingSession.findByPk.mockResolvedValue(mockSession);
      StagingAuditLog.findAll.mockResolvedValue([{ action: "A", user: { name: "U1" }, created_at: "2024" }]);

      const result = await getSessionDetail(1);
      expect(result.session.session_number).toBe("S-1");
      expect(result.session.items[0].rfid_tag).toBe("R1");
      expect(result.session.items[0].outbound_item.outbound.order_number).toBe("ORD1");
      expect(result.session.items[0].location.location_code).toBe("LOC1");
    });

    it("should handle missing related data in getSessionDetail", async () => {
      const mockSession = { 
        id: 1, 
        session_number: "S-1", 
        status: "OPEN",
        items: [
          { rfid_tag: "R1", outbound_item: null, location: null }
        ]
      };
      StagingSession.findByPk.mockResolvedValue(mockSession);
      StagingAuditLog.findAll.mockResolvedValue([{ action: "A", user: null, created_at: "2024" }]);

      const result = await getSessionDetail(1);
      expect(result.session.items[0].outbound_item).toBeNull();
      expect(result.audit_logs[0].user).toBeNull();
    });

    it("should test getStagingSessions", async () => {
      const { getStagingSessions } = require("../../../src/services/staging/get-session-detail-service");
      StagingSession.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1, session_number: "S-1", status: "OPEN" }] });
      const result = await getStagingSessions({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it("should use default pagination when getStagingSessions called without args", async () => {
      const { getStagingSessions } = require("../../../src/services/staging/get-session-detail-service");
      StagingSession.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const result = await getStagingSessions();
      expect(StagingSession.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe("finalizeSession", () => {
    it("should throw error if session not found or not OPEN", async () => {
      StagingSession.findByPk.mockResolvedValue(null);
      await expect(finalizeSession(1, 1)).rejects.toThrow(/not found or already finalized/);
    });

    it("should throw error if no items in staging to finalize", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      StagingItem.findAll.mockResolvedValue([]);
      await expect(finalizeSession(1, 1)).rejects.toThrow("No items in staging to finalize");
    });

    it("should process finalize successfully for all items", async () => {
      const mockSession = { id: 1, session_number: "S1", status: "OPEN", save: jest.fn() };
      const mockStgItem = { id: 100, rfid_tag: "R1", status: "STAGED", outbound_item_id: 10, location_id: 1, save: jest.fn() };
      const mockObItem = { id: 10, outbound_id: 5, qty_delivered: 0, qty_target: 1, save: jest.fn() };
      const mockItem = { id: 7, sku_code: "SKU1" };
      const mockItemLoc = { id: 300, stock: 5, save: jest.fn() };
      
      mockInventoryMovement.create = jest.fn();
      
      StagingSession.findByPk.mockResolvedValue(mockSession);
      StagingItem.findAll.mockResolvedValue([mockStgItem]);
      OutboundItem.findByPk.mockResolvedValue(mockObItem);
      OutboundItem.findAll.mockResolvedValue([mockObItem]); 
      Item.findOne.mockResolvedValue(mockItem);
      ItemLocation.findOne.mockResolvedValue(mockItemLoc);
      Outbound.findByPk.mockResolvedValue({ id: 5, order_number: "ORD1" });

      const result = await finalizeSession(1, 1);

      expect(mockStgItem.status).toBe("FINALIZED");       
      expect(mockObItem.qty_delivered).toBe(1);
      expect(mockSession.status).toBe("FINALIZED");       
      expect(result.message).toContain("successfully");   
    });

    it("should skip processing if outbound item not found", async () => {
      const mockSession = { id: 1, session_number: "S1", status: "OPEN", save: jest.fn() };
      const mockStgItem = { id: 100, outbound_item_id: 10, rfid_tag: "R1", location_id: 1, save: jest.fn() };
      
      StagingSession.findByPk.mockResolvedValue(mockSession);
      StagingItem.findAll.mockResolvedValue([mockStgItem]);
      OutboundItem.findByPk.mockResolvedValue(null); // Missing obItem
      OutboundItem.findAll.mockResolvedValue([]);

      await finalizeSession(1, 1);
      expect(mockStgItem.save).toHaveBeenCalled();
      expect(Outbound.update).not.toHaveBeenCalled();
    });

    it("should update outbound status to PROCES if not all items delivered", async () => {
      const mockSession = { id: 1, session_number: "S1", status: "OPEN", save: jest.fn() };
      const mockStgItem = { id: 100, rfid_tag: "R1", status: "STAGED", outbound_item_id: 10, location_id: 1, save: jest.fn() };
      const mockObItem = { id: 10, outbound_id: 5, qty_delivered: 0, qty_target: 2, save: jest.fn() }; // target 2, only 1 delivered
      const mockItem = { id: 7, sku_code: "SKU1" };
      const mockItemLoc = { id: 300, stock: 5, save: jest.fn() };
      
      StagingSession.findByPk.mockResolvedValue(mockSession);
      StagingItem.findAll.mockResolvedValue([mockStgItem]);
      OutboundItem.findByPk.mockResolvedValue(mockObItem);
      OutboundItem.findAll.mockResolvedValue([mockObItem]); 
      Item.findOne.mockResolvedValue(mockItem);
      ItemLocation.findOne.mockResolvedValue(mockItemLoc);
      Outbound.findByPk.mockResolvedValue({ id: 5, order_number: "ORD1" });

      await finalizeSession(1, 1);
      expect(Outbound.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "PROCES" }),
        expect.anything()
      );
    });

    it("should rollback transaction on error in finalizeSession", async () => {
      StagingSession.findByPk.mockRejectedValue(new Error("Finalize Error"));
      await expect(finalizeSession(1, 1)).rejects.toThrow("Finalize Error");
    });

    it("should handle error before transaction is created in finalizeSession", async () => {
      sequelize.transaction.mockRejectedValueOnce(new Error("Transaction Fail"));
      await expect(finalizeSession(1, 1)).rejects.toThrow("Transaction Fail");
    });

    it("should throw and skip rollback when finalizeSession has no transaction object", async () => {
      sequelize.transaction.mockResolvedValueOnce(undefined);
      StagingSession.findByPk.mockRejectedValueOnce(new Error("Finalize without tx"));

      await expect(finalizeSession(1, 1)).rejects.toThrow("Finalize without tx");
    });
  });

  describe("addItem", () => {
    const addItem = require("../../../src/services/staging/add-item-service");
    const mockScanData = { rfid_tag: "R1", location_qr: "LOC1" };

    it("should throw error if session not found or not OPEN", async () => {
      StagingSession.findByPk.mockResolvedValue(null);
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow(/not found or not in OPEN status/);
    });

    it("should throw error if item already staged", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      
      Location.findOne = jest.fn().mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue({ id: 1, sku_code: "SKU1", rfid_tag: "R1" });
      StagingItem.findOne.mockResolvedValue({ id: 10 }); // Already staged
      
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow("Item is already in a staging area");
    });

    it("should throw error if location is invalid", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      
      Location.findOne = jest.fn().mockResolvedValue(null);
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow("Invalid or inactive source location");
    });

    it("should throw error if RFID tag not found", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      
      Location.findOne = jest.fn().mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue(null);
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow("RFID tag not found in system");
    });

    it("should throw error if stock empty in location", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      
      Location.findOne = jest.fn().mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue({ id: 1, sku_code: "SKU1", rfid_tag: "R1" });
      StagingItem.findOne.mockResolvedValue(null);
      ItemLocation.findOne.mockResolvedValue(null);
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow(/stock is empty in location/);
    });

    it("should throw error if no pending outbound orders found", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      Location.findOne.mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue({ id: 1, sku_code: "SKU1", rfid_tag: "R1" });
      StagingItem.findOne.mockResolvedValue(null);
      ItemLocation.findOne.mockResolvedValue({ stock: 5 });
      OutboundItem.findOne.mockResolvedValue(null);
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow(/No pending outbound orders found/);
    });

    it("should throw error if associated outbound order not found or DONE", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      Location.findOne.mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue({ id: 1, sku_code: "SKU1", rfid_tag: "R1" });
      StagingItem.findOne.mockResolvedValue(null);
      ItemLocation.findOne.mockResolvedValue({ stock: 5 });
      OutboundItem.findOne.mockResolvedValue({ id: 5, outbound_id: 10 });
      Outbound.findByPk.mockResolvedValue(null);
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow(/Associated outbound order is already DONE or not found/);
    });

    it("should process addItem successfully and handle stock zero", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      Location.findOne.mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue({ id: 1, sku_code: "SKU1", rfid_tag: "R1" });
      const mockItemLoc = { stock: 1, save: jest.fn(), destroy: jest.fn() };
      const mockObItem = { qty_staged: 0, qty_target: 1, save: jest.fn() };
      const mockObHeader = { id: 10, order_number: "O-10", status: "PENDING", save: jest.fn() };

      StagingItem.findOne.mockResolvedValue(null);
      ItemLocation.findOne.mockResolvedValue(mockItemLoc);
      OutboundItem.findOne.mockResolvedValue(mockObItem);
      Outbound.findByPk.mockResolvedValue(mockObHeader);
      StagingItem.create.mockResolvedValue({ id: 100 });

      const result = await addItem(1, mockScanData, 1);
      expect(mockItemLoc.destroy).toHaveBeenCalled();
      expect(result.staging_item).toBeDefined();
    });

    it("should process addItem and save itemLoc if stock > 0", async () => {
      StagingSession.findByPk.mockResolvedValue({ id: 1, status: "OPEN" });
      Location.findOne.mockResolvedValue({ id: 1, status: "ACTIVE" });
      Item.findOne.mockResolvedValue({ id: 1, sku_code: "SKU1", rfid_tag: "R1" });
      const mockItemLoc = { stock: 5, save: jest.fn(), destroy: jest.fn() };
      const mockObItem = { qty_staged: 0, qty_target: 1, save: jest.fn() };
      const mockObHeader = { id: 10, order_number: "O-10", status: "PENDING", save: jest.fn() };

      StagingItem.findOne.mockResolvedValue(null);
      ItemLocation.findOne.mockResolvedValue(mockItemLoc);
      OutboundItem.findOne.mockResolvedValue(mockObItem);
      Outbound.findByPk.mockResolvedValue(mockObHeader);
      StagingItem.create.mockResolvedValue({ id: 100 });

      await addItem(1, mockScanData, 1);
      expect(mockItemLoc.save).toHaveBeenCalled();
    });

    it("should handle error before transaction is created in addItem", async () => {
      sequelize.transaction.mockRejectedValueOnce(new Error("Transaction Fail"));
      await expect(addItem(1, mockScanData, 1)).rejects.toThrow("Transaction Fail");
    });

    it("should throw and skip rollback when addItem has no transaction object", async () => {
      sequelize.transaction.mockResolvedValueOnce(undefined);
      StagingSession.findByPk.mockRejectedValueOnce(new Error("Add item without tx"));

      await expect(addItem(1, mockScanData, 1)).rejects.toThrow("Add item without tx");
    });
  });
});
