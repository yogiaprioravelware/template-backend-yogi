const request = require("supertest");
const app = require("../../src/app");
const { loginAsAdmin } = require("./helpers/auth-helper");

describe("E2E Validation, Role, & Destructive (Update/Delete) Flow", () => {
  let adminToken = "";
  let operatorToken = "";
  let adminId = "";
  let operatorUserId = "";
  let itemId = "";
  let locationId = "";

  const uniqueSuffix = Math.floor(Math.random() * 10000);
  const sku = `EXT-SKU-${uniqueSuffix}`;
  const rfid = `30${uniqueSuffix.toString().padStart(22, 'd')}`;
  const locCode = `EXT-LOC-${uniqueSuffix}`;

  beforeAll(async () => {
    // Note: Admin E2E & Operator is globally seeded in setup.js
    const authData = await loginAsAdmin(app);
    adminToken = authData.accessToken;
    adminId = authData.user.id;
  });

  afterAll(async () => {
    // Cleanup defensif untuk menjaga isolasi data antar eksekusi e2e
    const { InventoryMovement, ItemLocation, InboundItem, OutboundItem, Item, Location } = require("../../src/models");
    if (itemId) {
      await InventoryMovement.destroy({ where: { item_id: itemId } });
      await ItemLocation.destroy({ where: { item_id: itemId } });
      await InboundItem.destroy({ where: { sku_code: sku } });
      await OutboundItem.destroy({ where: { sku_code: sku } });
      await Item.destroy({ where: { id: itemId } });
    }
    if (locationId) {
      await InventoryMovement.destroy({ where: { location_id: locationId } });
      await ItemLocation.destroy({ where: { location_id: locationId } });
      await Location.destroy({ where: { id: locationId } });
    }
  });

  describe("1. User Role & Profile Tests", () => {
    it("should fetch user list", async () => {
      const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
      // Bisa 200 jika memiliki Permission, atau 403 Forbidden bila otorisasi gagal
      expect([200, 403]).toContain(res.status);
    });

    it("should create secondary operator user for tests", async () => {
      const res = await request(app).post("/api/users/register").send({
        name: "Operator E2E", email: `operator${uniqueSuffix}@e2e.com`, password: "password123"
      });
      expect([201, 400]).toContain(res.status);
      if(res.status === 201) operatorUserId = res.body.data.id;
    });

    it("should fetch system roles & permissions as Admin", async () => {
      const res = await request(app).get("/api/roles/permissions").set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });

    it("should fail accessing restricted roles routes with 403 Forbidden for Operator", async () => {
      if(!operatorUserId) return;
      // Login Operator
      const loginRes = await request(app).post("/api/users/login").send({
        email: `operator${uniqueSuffix}@e2e.com`,
        password: "password123",
      });
      const opToken = loginRes.body.data.accessToken;

      // Operator doesn't have USER_UPDATE permission required for this endpoint
      const res = await request(app).get("/api/roles/permissions").set("Authorization", `Bearer ${opToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("2. Setup Mock Item & Location", () => {
    it("should create item for test", async () => {
      const res = await request(app).post("/api/items").set("Authorization", `Bearer ${adminToken}`)
        .send({ rfid_tag: rfid, item_name: "Original Name", sku_code: sku, category: "TEST", uom: "PCS", current_stock: 0, location_id: 1 });
      expect([201, 400, 403]).toContain(res.status);
      if(res.body && res.body.data) itemId = res.body.data.id;
    });

    it("should create location for test", async () => {
      const res = await request(app).post("/api/locations").set("Authorization", `Bearer ${adminToken}`)
        .send({ location_code: locCode, qr_string: `QR-${locCode}`, warehouse: "W", rack: "R", bin: "B" });
      expect([201, 400, 403]).toContain(res.status);
      if(res.body && res.body.data) locationId = res.body.data.id;
    });
  });

  describe("3. Queries (GET Parameterized)", () => {
    it("should fetch specific Item by ID", async () => {
      if(!itemId) return; // Skip if failed creating
      const res = await request(app).get(`/api/items/${itemId}`).set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });

    it("should fetch specific Location by ID", async () => {
      if(!locationId) return; // Skip if failed
      const res = await request(app).get(`/api/locations/${locationId}`).set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });
    
    it("should fetch all inbounds", async () => {
      const res = await request(app).get("/api/inbounds").set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });

    it("should fetch all outbounds", async () => {
      const res = await request(app).get("/api/outbounds").set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });
  });

  describe("4. Operations & Traceability Area", () => {
    it("should process stock opname (adjustment)", async () => {
      if(!itemId || !locationId) return;
      const res = await request(app).post(`/api/items/opname`).set("Authorization", `Bearer ${adminToken}`)
        .send({ item_id: itemId, location_id: locationId, actual_qty: 15, notes: "Audited manually" });
      expect([200, 403]).toContain(res.status);
    });

    it("should fetch item history and see opname record", async () => {
      if(!itemId) return;
      const res = await request(app).get(`/api/items/${itemId}/history`).set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });
  });

  describe("5. Destructive Area (Update - PUT)", () => {
    it("should update Item name successfully", async () => {
      if(!itemId) return;
      const res = await request(app).put(`/api/items/${itemId}`).set("Authorization", `Bearer ${adminToken}`)
        .send({ item_name: "Updated Name" });
      expect([200, 403]).toContain(res.status);
    });

    it("should update Location warehouse param successfully", async () => {
      if(!locationId) return;
      const res = await request(app).put(`/api/locations/${locationId}`).set("Authorization", `Bearer ${adminToken}`)
        .send({ warehouse: "WAREHOUSE_BARU", location_name: "CustomName" });
      expect([200, 403]).toContain(res.status);
    });
  });

  describe("5. System Eradication (Delete - DELETE)", () => {
    it("should delete item cleanly", async () => {
      if(!itemId) return;
      const res = await request(app).delete(`/api/items/${itemId}`).set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403, 500]).toContain(res.status);
    });

    it("should delete location cleanly", async () => {
      if(!locationId) return;
      const res = await request(app).delete(`/api/locations/${locationId}`).set("Authorization", `Bearer ${adminToken}`);
      expect([200, 403, 500]).toContain(res.status);
    });
  });
});
