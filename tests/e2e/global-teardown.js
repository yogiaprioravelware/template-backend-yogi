module.exports = async () => {
  const { sequelize } = require("../../src/models");
  await sequelize.close();
};
