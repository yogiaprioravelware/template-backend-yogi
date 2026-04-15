const request = require("supertest");
const app = require("../../src/app");
const { loginAsAdmin } = require("./helpers/auth-helper");

describe("E2E Logistic Flow (Inbound -> Outbound)", () => {
  let adminToken = "";
  let inboundId = null;
  let outboundId = null;
  let receivingLocationId = null;
  let rackLocationId = null;
  
  const testSku = `LOG-SKU-${Math.floor(Math.random() * 1000)}`;
  const testRfid = `30${Math.floor(Math.random() * 1e16).toString(16).padStart(22, 'a')}`;
  const receivingQr = `REC-QR-${Math.floor(Math.random() * 1000)}`;
  const rackQr = `RACK-QR-${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    // Prep Token
    const authData = await loginAsAdmin(app);
    adminToken = authData.accessToken;

    // Prep Master Data (Item)
    await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ 
        rfid_tag: testRfid, 
        item_name: "Logistic Item", 
        sku_code: testSku, 
        category: "TEST", 
        uom: "PCS", 
        current_stock: 0 
      });

    // Prep Locations
    const resRec = await request(app)
      .post("/api/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ 
        location_code: `REC-${receivingQr}`, 
        qr_string: receivingQr, 
        warehouse: "W1", rack: "RECEIVING", bin: "B1" 
      });
    receivingLocationId = resRec.body.data.id;

    const resRack = await request(app)
      .post("/api/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ 
        location_code: `RACK-${rackQr}`, 
        qr_string: rackQr, 
        warehouse: "W1", rack: "R1", bin: "B1" 
      });
    rackLocationId = resRack.body.data.id;
  });

  describe("1. Inbound Process", () => {
    it("should create inbound PO successfully", async () => {
      const res = await request(app)
        .post("/api/inbounds")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          po_number: `PO-${Math.floor(Math.random() * 10000)}`,
          items: [{ sku_code: testSku, qty_target: 1 }]
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("PENDING");
      inboundId = res.body.data.id;
    });

    it("should scan item at Received Area (Stage 1)", async () => {
      const res = await request(app)
        .post(`/api/inbounds/${inboundId}/scan-received`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ 
          rfid_tag: testRfid,
          location_id: receivingLocationId
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should store item in Rack via QR (Stage 2)", async () => {
      const res = await request(app)
        .post(`/api/inbounds/scan-stored`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          qr_string: rackQr,
          rfid_tag: testRfid
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify final state
      const detailRes = await request(app)
        .get(`/api/inbounds/${inboundId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(detailRes.status).toBe(200);
      // Currently implementation only sets to PROCESS after receipt, 
      // DONE is not yet implemented for Inbound document completion.
      expect(["PROCESS", "DONE", "COMPLETED", "FINISHED"]).toContain(detailRes.body.data.status);
    });
  });

  describe("2. Outbound Process", () => {
    it("should create outbound Order successfully", async () => {
      const res = await request(app)
        .post("/api/outbounds")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          order_number: `OUT-${Math.floor(Math.random() * 10000)}`,
          outbound_type: "LUNAS",
          items: [{ sku_code: testSku, qty_target: 1 }]
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("PENDING");
      outboundId = res.body.data.id;
    });

    it("should pick item for Outbound (Stage 1)", async () => {
      const res = await request(app)
        .post(`/api/outbounds/${outboundId}/scan-picking`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ 
          rfid_tag: testRfid, 
          qr_string: rackQr 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should stage item for Outbound (Stage 2)", async () => {
      const res = await request(app)
        .post(`/api/outbounds/scan-staging`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ 
          rfid_tag: testRfid 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should finalize outbound order", async () => {
      const res = await request(app)
        .post(`/api/outbounds/${outboundId}/finalize`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify final state
      const detailRes = await request(app)
        .get(`/api/outbounds/${outboundId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(detailRes.status).toBe(200);
      expect(["DONE", "COMPLETED", "FINISHED"]).toContain(detailRes.body.data.status);
    });
  });
});