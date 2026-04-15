require("dotenv").config({ path: ".env.test" });

const { sequelize } = require("../../src/models");

afterAll(async () => {
  try {
    // Each test file runs in sequence (runInBand), 
    // closing the connection at the end of each suite ensures no open handles.
    await sequelize.close();
  } catch (err) {
    // Ignore error if already closed
  }
});
