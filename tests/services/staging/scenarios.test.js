const addItem = require("../../../src/services/staging/add-item-service");
const finalizeSession = require("../../../src/services/staging/finalize-session-service");
const finalizeOrderSync = require("../../../src/services/outbound/finalize-order-sync-service");
const { 
  StagingSession, 
  StagingItem, 
  StagingAuditLog, 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  Location, 
  InventoryMovement,
  sequelize
} = require("../../../src/models");
const { reconcileItemStock } = require("../../../src/utils/reconciliation");

jest.mock("../../../src/models", () => ({
  StagingSession: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  StagingItem: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    update: jest.fn()
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
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  Item: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  ItemLocation: {
    findOne: jest.fn(),
  },
  Location: {
    findOne: jest.fn(),
  },
  InventoryMovement: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn()
    })),
    col: jest.fn(col => col)
  },
  Op: {
    lt: Symbol('lt'),
    in: Symbol('in'),
    like: Symbol('like')
  }
}));

jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/reconciliation", () => ({
  reconcileItemStock: jest.fn(),
}));

describe("Staging Scenario Tests", () => {
  const mockUserId = 1;
  const mockSessionId = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Scenario 1: Items from two different racks", () => {
    it("should process items from two different racks for a single order", async () => {
      const mockOrder = { id: 1, order_number: "ORD-001", status: "PROCES", items: [], save: jest.fn() };
      const mockObItem = { id: 100, outbound_id: 1, sku_code: "SKU-A", qty_staged: 0, qty_target: 2, qty_delivered: 0, save: jest.fn() };
      const mockItem = { id: 7, sku_code: "SKU-A", rfid_tag: "RFID-1" };
      const mockItem2 = { id: 7, sku_code: "SKU-A", rfid_tag: "RFID-2" };
      
      const loc1 = { id: 1, location_code: "LOC-01", qr_string: "QR-01", status: "ACTIVE" };
      const loc2 = { id: 2, location_code: "LOC-02", qr_string: "QR-02", status: "ACTIVE" };
      
      const itemLoc1 = { stock: 1, save: jest.fn(), destroy: jest.fn() };
      const itemLoc2 = { stock: 1, save: jest.fn(), destroy: jest.fn() };

      StagingSession.findByPk.mockResolvedValue({ id: mockSessionId, status: "OPEN", save: jest.fn() });
      Location.findOne.mockImplementation(({ where }) => {
        if (where.qr_string === "QR-01") return Promise.resolve(loc1);
        if (where.qr_string === "QR-02") return Promise.resolve(loc2);
        return Promise.resolve(null);
      });
      Item.findOne.mockImplementation(({ where }) => {
        if (where.rfid_tag === "RFID-1") return Promise.resolve(mockItem);
        if (where.rfid_tag === "RFID-2") return Promise.resolve(mockItem2);
        return Promise.resolve(null);
      });
      StagingItem.findOne.mockResolvedValue(null);
      ItemLocation.findOne.mockImplementation(({ where }) => {
        if (where.location_id === 1) return Promise.resolve(itemLoc1);
        if (where.location_id === 2) return Promise.resolve(itemLoc2);
        return Promise.resolve(null);
      });
      OutboundItem.findOne.mockResolvedValue(mockObItem);
      Outbound.findByPk.mockResolvedValue(mockOrder);
      StagingItem.create.mockResolvedValue({ id: 500 });

      await addItem(mockSessionId, { rfid_tag: "RFID-1", location_qr: "QR-01" }, mockUserId);
      expect(itemLoc1.destroy).toHaveBeenCalled(); 
      expect(mockObItem.qty_staged).toBe(1);

      await addItem(mockSessionId, { rfid_tag: "RFID-2", location_qr: "QR-02" }, mockUserId);
      expect(itemLoc2.destroy).toHaveBeenCalled(); 
      expect(mockObItem.qty_staged).toBe(2);

      const mockStagingItems = [
        { id: 500, outbound_item_id: 100, rfid_tag: "RFID-1", location_id: 1, status: "STAGED", save: jest.fn() },
        { id: 501, outbound_item_id: 100, rfid_tag: "RFID-2", location_id: 2, status: "STAGED", save: jest.fn() }
      ];
      StagingItem.findAll.mockResolvedValue(mockStagingItems);
      OutboundItem.findByPk.mockResolvedValue(mockObItem);
      OutboundItem.findAll.mockResolvedValue([mockObItem]); 
      Item.findOne.mockResolvedValue({ id: 7, sku_code: "SKU-A" });
      ItemLocation.findOne.mockResolvedValue({ id: 300, stock: 10, save: jest.fn() });
      
      const finalizeResult = await finalizeSession(mockSessionId, mockUserId);
      
      expect(finalizeResult.item_count).toBe(2);
      expect(mockObItem.qty_delivered).toBe(2); 
    });
  });

  describe("Scenario 2: Multiple orders from same rack", () => {
    it("should fulfill oldest order first when scanning items from same rack", async () => {
      const loc1 = { id: 1, location_code: "LOC-01", qr_string: "QR-01", status: "ACTIVE" };
      const itemLoc = { stock: 10, save: jest.fn(), destroy: jest.fn() };
      
      const order1 = { id: 1, order_number: "ORD-OLD", status: "PROCES" };
      const order2 = { id: 2, order_number: "ORD-NEW", status: "PROCES" };
      
      const obItem1 = { id: 101, outbound_id: 1, sku_code: "SKU-A", qty_staged: 0, qty_target: 1, save: jest.fn() };
      const obItem2 = { id: 102, outbound_id: 2, sku_code: "SKU-A", qty_staged: 0, qty_target: 1, save: jest.fn() };
      
      const rfid1 = { id: 7, sku_code: "SKU-A", rfid_tag: "RFID-1" };
      const rfid2 = { id: 8, sku_code: "SKU-A", rfid_tag: "RFID-2" };

      StagingSession.findByPk.mockResolvedValue({ id: mockSessionId, status: "OPEN" });
      Location.findOne.mockResolvedValue(loc1);
      ItemLocation.findOne.mockResolvedValue(itemLoc);
      
      OutboundItem.findOne
        .mockResolvedValueOnce(obItem1)
        .mockResolvedValueOnce(obItem2);
        
      Outbound.findByPk
        .mockResolvedValueOnce(order1)
        .mockResolvedValueOnce(order2);
        
      Item.findOne
        .mockResolvedValueOnce(rfid1)
        .mockResolvedValueOnce(rfid2);

      await addItem(mockSessionId, { rfid_tag: "RFID-1", location_qr: "QR-01" }, mockUserId);
      expect(obItem1.qty_staged).toBe(1);

      await addItem(mockSessionId, { rfid_tag: "RFID-2", location_qr: "QR-01" }, mockUserId);
      expect(obItem2.qty_staged).toBe(1);
    });
  });

  describe("Scenario 3: Single order, items same rack", () => {
    it("should fulfill single order fully from one rack", async () => {
      const loc = { id: 1, location_code: "LOC-01", qr_string: "QR-01", status: "ACTIVE" };
      const itemLoc = { stock: 5, save: jest.fn(), destroy: jest.fn() };
      const order = { id: 1, order_number: "ORD-003", status: "PROCES", save: jest.fn() };
      const obItem = { id: 103, outbound_id: 1, sku_code: "SKU-B", qty_staged: 0, qty_target: 2, qty_delivered: 0, save: jest.fn() };
      order.items = [obItem];

      StagingSession.findByPk.mockResolvedValue({ id: mockSessionId, status: "OPEN" });
      Location.findOne.mockResolvedValue(loc);
      ItemLocation.findOne.mockResolvedValue(itemLoc);
      Item.findOne.mockResolvedValue({ id: 9, sku_code: "SKU-B", rfid_tag: "R-3" });
      OutboundItem.findOne.mockResolvedValue(obItem);
      Outbound.findByPk.mockResolvedValue(order);
      
      await addItem(mockSessionId, { rfid_tag: "R-3", location_qr: "QR-01" }, mockUserId);
      await addItem(mockSessionId, { rfid_tag: "R-3", location_qr: "QR-01" }, mockUserId);
      
      expect(obItem.qty_staged).toBe(2);
      
      obItem.qty_delivered = 2; 
      StagingItem.findAll.mockResolvedValue([{ id: 1, status: "STAGED", save: jest.fn(), staging_session_id: mockSessionId }]);
      StagingItem.count.mockResolvedValue(0); 
      Item.findAll.mockResolvedValue([{ id: 9 }]);

      await finalizeOrderSync(1, mockUserId);
      
      expect(order.status).toBe("DONE");
      expect(StagingSession.update).toHaveBeenCalled();
    });
  });
});
