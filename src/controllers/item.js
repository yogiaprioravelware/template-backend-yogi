const itemService = require("../services/item");
const response = require("../utils/response");
const logger = require("../utils/logger");

// Registrasi item baru dengan scan RFID
const registerItem = async (req, res, next) => {
  logger.info("Registering a new item");
  try {
    const result = await itemService.registerItem(req.body);
    res.status(201).json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Mengambil semua item
const getItems = async (req, res, next) => {
  logger.info("Fetching all items");
  try {
    const items = await itemService.getItems();
    res.json(response.success(items));
  } catch (err) {
    next(err);
  }
};

// Mengambil item berdasarkan ID
const getItemById = async (req, res, next) => {
  logger.info(`Fetching item with id: ${req.params.id}`);
  try {
    const item = await itemService.getItemById(req.params.id);
    res.json(response.success(item));
  } catch (err) {
    next(err);
  }
};

// Memperbarui data item
const updateItem = async (req, res, next) => {
  logger.info(`Updating item with id: ${req.params.id}`);
  try {
    const result = await itemService.updateItem(req.params.id, req.body);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Menghapus item
const deleteItem = async (req, res, next) => {
  logger.info(`Deleting item with id: ${req.params.id}`);
  try {
    const result = await itemService.deleteItem(req.params.id);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};