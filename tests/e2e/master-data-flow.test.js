const request = require("supertest");
const app = require("../../src/app");
const Item = require("../../src/models/Item");
const { loginAsAdmin } = require("./helpers/auth-helper");

describe("E2E Master Data Flow (Item & Location)", () => {
  let adminToken = "";
  const randomSku = `SKU-${Math.floor(Math.random() * 1000)}`;
  const randomRfid = `30${Math.floor(Math.random() * 1e16).toString(16).padStart(22, 'c')}`;

  beforeAll(async () => {
    // Precondition check: admin login harus sukses sebelum flow berjalan.
    const authData = await loginAsAdmin(app);
    adminToken = authData.accessToken;
  });

  describe("1. Item Management", () => {
    it("should fail creating item if fields are empty", async () => {
      const res = await request(app)
        .post("/api/items")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("should successfully create new item", async () => {
      const res = await request(app)
        .post("/api/items")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          rfid_tag: randomRfid,
          item_name: "Item E2E Test",
          sku_code: randomSku,
          category: "Logistics",
          uom: "PCS",
          current_stock: 0,
          location_id: 1,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should fail creating item with duplicate RFID or SKU", async () => {
      const res = await request(app)
        .post("/api/items")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          rfid_tag: randomRfid, // Duplicate
          item_name: "Item E2E Fail",
          sku_code: randomSku, // Duplicate
          category: "Logistics",
          uom: "PCS",
          current_stock: 0,
        });
      expect(res.status).toBe(400);
    });

    it("should retrieve all items", async () => {
      const res = await request(app)
        .get("/api/items")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const items = Array.isArray(res.body.data) ? res.body.data : res.body.data?.data;
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("2. Location Management", () => {
    const locCode = `L-${Math.floor(Math.random() * 100)}`;
    const qrStr = `QR-${Math.floor(Math.random() * 100)}`;
    
    it("should create location successfully", async () => {
      const res = await request(app)
        .post("/api/locations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          location_code: locCode,
          qr_string: qrStr,
          warehouse: "W1",
          rack: "R1",
          bin: "B1",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should fail creating location with duplicate code or qr", async () => {
      const res = await request(app)
        .post("/api/locations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          location_code: locCode, // Duplicate
          qr_string: qrStr, // Duplicate
          warehouse: "W1",
          rack: "R1",
          bin: "B1",
        });
      expect(res.status).toBe(400);
    });
  });
});
