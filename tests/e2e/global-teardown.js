module.exports = async () => {
  const { sequelize } = require("../../src/models");
  try {
    await sequelize.close();
    console.log("Global Teardown: Database connection closed.");
  } catch (err) {
    console.error("Global Teardown: Error closing database connection:", err);
  }
};
