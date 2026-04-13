const Location = require("../models/Location");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger");
const {
  createLocationSchema,
  updateLocationSchema,
} = require("../validations/location-validation");


const createLocation = async (req, res, next) => {
  logger.info("Attempting to create a new location");
  try {
    // Validate request body
    const { error, value } = createLocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json(
        errorResponse(400, "Validation error", {
          message: error.details[0].message,
        })
      );
    }

     const { location_code, qr_string, warehouse, rack, bin, location_name } =
      value;

    const existingByCode = await Location.findOne({
      where: { location_code },
    });

    if (existingByCode) {
      return res.status(400).json(
        errorResponse(400, "Location code already exists", {
          message: "Kode lokasi sudah terdaftar",
        })
      );
    }

    const existingByQr = await Location.findOne({
      where: { qr_string },
    });

    if (existingByQr) {
      return res.status(400).json(
        errorResponse(400, "QR string already exists", {
          message: "QR code sudah terdaftar",
        })
      );
    }

    const location = await Location.create({
      location_code,
      qr_string,
      warehouse,
      rack,
      bin,
      location_name:
        location_name ||
        `${warehouse} - ${rack} - ${bin}`.trim(),
      status: "ACTIVE",
    });

    return res.status(201).json(
      successResponse(
        {
          id: location.id,
          location_code: location.location_code,
          qr_string: location.qr_string,
          warehouse: location.warehouse,
          rack: location.rack,
          bin: location.bin,
          location_name: location.location_name,
          status: location.status,
        },
        "Location created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};


const getLocations = async (req, res, next) => {
  logger.info("Fetching all locations");
  try {
    const locations = await Location.findAll({
      attributes: [
        "id",
        "location_code",
        "qr_string",
        "warehouse",
        "rack",
        "bin",
        "location_name",
        "status",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json(
      successResponse(
        locations,
        "Locations retrieved successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};


const getLocationById = async (req, res, next) => {
  logger.info(`Fetching location with ID: ${req.params.id}`);
  try {
    const location = await Location.findByPk(req.params.id, {
      attributes: [
        "id",
        "location_code",
        "qr_string",
        "warehouse",
        "rack",
        "bin",
        "location_name",
        "status",
        "created_at",
      ],
    });

    if (!location) {
      return res.status(400).json(
        errorResponse(400, "Location not found", {
          message: "Lokasi tidak ditemukan",
        })
      );
    }

    return res.json(
      successResponse(location, "Location retrieved successfully")
    );
  } catch (err) {
    next(err);
  }
};


const updateLocation = async (req, res, next) => {
  logger.info(`Attempting to update location with ID: ${req.params.id}`);
  try {
    // Validate request body
    const { error, value } = updateLocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json(
        errorResponse(400, "Validation error", {
          message: error.details[0].message,
        })
      );
    }

    const location = await Location.findByPk(req.params.id);

    if (!location) {
      return res.status(400).json(
        errorResponse(400, "Location not found", {
          message: "Lokasi tidak ditemukan",
        })
      );
    }

    const { location_code, qr_string, warehouse, rack, bin, location_name, status } = value;

    if (location_code && location_code !== location.location_code) {
      const existing = await Location.findOne({
        where: { location_code },
      });
      if (existing) {
        return res.status(400).json(
          errorResponse(400, "Location code already exists", {
            message: "Kode lokasi sudah terdaftar",
          })
        );
      }
    }

    if (qr_string && qr_string !== location.qr_string) {
      const existing = await Location.findOne({
        where: { qr_string },
      });
      if (existing) {
        return res.status(400).json(
          errorResponse(400, "QR string already exists", {
            message: "QR code sudah terdaftar",
          })
        );
      }
    }

    await location.update({
      location_code: location_code || location.location_code,
      qr_string: qr_string || location.qr_string,
      warehouse: warehouse || location.warehouse,
      rack: rack || location.rack,
      bin: bin || location.bin,
      location_name:
        location_name ||
        `${warehouse || location.warehouse} - ${rack || location.rack} - ${bin || location.bin}`.trim(),
      status: status || location.status,
    });

    return res.json(
      successResponse(
        {
          id: location.id,
          location_code: location.location_code,
          qr_string: location.qr_string,
          warehouse: location.warehouse,
          rack: location.rack,
          bin: location.bin,
          location_name: location.location_name,
          status: location.status,
        },
        "Location updated successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};


const deleteLocation = async (req, res, next) => {
  logger.info(`Attempting to delete location with ID: ${req.params.id}`);
  try {
    const location = await Location.findByPk(req.params.id);

    if (!location) {
      return res.status(400).json(
        errorResponse(400, "Location not found", {
          message: "Lokasi tidak ditemukan",
        })
      );
    }

    await location.destroy();

    return res.json(
      successResponse(null, "Location deleted successfully")
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};