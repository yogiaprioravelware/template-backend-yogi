const registerItem = require("./register-item-service");
const getItems = require("./get-items-service");
const getItemById = require("./get-item-by-id-service");
const updateItem = require("./update-item-service");
const deleteItem = require("./delete-item-service");

module.exports = {
  registerItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};
