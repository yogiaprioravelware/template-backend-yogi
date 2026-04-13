const request = require("supertest");
const app = require("../../src/app");
// Sequelize dijalankan sinkronisasi secara global via setup.js

describe("E2E User & Authentication Flow", () => {
  let token = "";
  const randomSuffix = Math.floor(Math.random() * 1000);
  const testEmail = `user${randomSuffix}@e2e.com`;

  describe("1. User Registration", () => {
    it("should fail validation if form is empty", async () => {
      const res = await request(app).post("/api/users/register").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should register successfully with correct payload", async () => {
      const res = await request(app).post("/api/users/register").send({
        name: "Test User",
        email: testEmail,
        password: "password123",
      });
      console.log(res.status, res.body); expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
    });

    it("should fail because email already exists", async () => {
      const res = await request(app).post("/api/users/register").send({
        name: "Test User 2",
        email: testEmail, // Email sama
        password: "password123",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. User Authentication (Login)", () => {
    it("should fail login with wrong password", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: testEmail,
        password: "wrongpassword",
      });
      expect(res.status).toBe(401);
    });

    it("should fail login with non-existent email", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: "ghost@e2e.com",
        password: "password123",
      });
      expect(res.status).toBe(401);
    });

    it("should login successfully and return access and refresh tokens", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: testEmail,
        password: "password123",
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("refreshToken");
      token = res.body.data.accessToken;
    });
  });

  describe("3. Authorization Handling", () => {
    it("should fail to get users without token", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });

    it("should fail if token is invalid", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", "Bearer invalid.token.string");
      expect(res.status).toBe(401);
    });
  });
});
