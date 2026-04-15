const stagingService = require("../services/staging");
const response = require("../utils/response");
const logger = require("../utils/logger");

const createSession = async (req, res, next) => {
  logger.info("Controller: Creating a new staging session");
  try {
    const result = await stagingService.createSession(req.body, req.user?.id);
    res.status(201).json(response.success(result));
  } catch (err) {
    next(err);
  }
};

const getStagingSessions = async (req, res, next) => {
  logger.info("Controller: Fetching all staging sessions");
  try {
    const result = await stagingService.getStagingSessions();
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

const getSessionDetail = async (req, res, next) => {
  logger.info(`Controller: Fetching detail for session: ${req.params.id}`);
  try {
    const result = await stagingService.getSessionDetail(req.params.id);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

const addStagingItem = async (req, res, next) => {
  logger.info(`Controller: Adding item to session: ${req.params.id}`);
  try {
    const result = await stagingService.addItem(req.params.id, req.body, req.user?.id);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

const finalizeSession = async (req, res, next) => {
  logger.info(`Controller: Finalizing session: ${req.params.id}`);
  try {
    const result = await stagingService.finalizeSession(req.params.id, req.user?.id);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSession,
  getStagingSessions,
  getSessionDetail,
  addStagingItem,
  finalizeSession,
};
