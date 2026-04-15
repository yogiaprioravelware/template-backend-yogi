const request = require("supertest");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (operation, { retries = 2, delayMs = 300 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt <= retries) {
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
};

const loginAsAdmin = async (app) => {
  const loginRes = await withRetry(
    async () => request(app).post("/api/users/login").send({
      email: "admin@e2e.com",
      password: "password123",
    }),
    { retries: 2, delayMs: 400 }
  );

  if (loginRes.status !== 200 || !loginRes.body?.data?.accessToken) {
    throw new Error(
      `Admin login precondition failed. status=${loginRes.status}, body=${JSON.stringify(loginRes.body)}`
    );
  }

  return loginRes.body.data;
};

module.exports = {
  loginAsAdmin,
  withRetry,
};
