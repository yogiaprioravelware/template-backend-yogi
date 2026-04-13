const transferLocationService = require("../services/inventory/transfer-location-service");
const { successResponse, errorResponse } = require("../utils/response");

const transferLocation = async (req, res, next) => {
  try {
    const result = await transferLocationService(req.body);
    return res.status(200).json(successResponse(result, "Location transfer successful"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  transferLocation,
};
