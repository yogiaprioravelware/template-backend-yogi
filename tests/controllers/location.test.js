const locationController = require('../../src/controllers/location');
const Location = require('../../src/models/Location');
const { successResponse, errorResponse } = require('../../src/utils/response');

jest.mock('../../src/models/Location');
jest.mock('../../src/utils/logger');

describe('Controller: location', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('registerLocation should return 201', async () => {
    req.body = { location_code: 'L1', qr_string: 'QR1', warehouse: 'W1', rack: 'R1', bin: 'B1' };
    Location.findOne.mockResolvedValue(null);
    Location.create.mockResolvedValue({ id: 1, location_code: 'L1', status: 'ACTIVE' });
    await locationController.createLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getLocations should return locations', async () => {
    Location.findAll.mockResolvedValue([]);
    await locationController.getLocations(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('getLocationById should return a location', async () => {
    req.params.id = 1;
    Location.findByPk.mockResolvedValue({ id: 1 });
    await locationController.getLocationById(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('updateLocation should return updated', async () => {
    req.params.id = 1;
    req.body = { location_code: 'L2' };
    const mockLocation = { location_code: 'L1', update: jest.fn() };
    Location.findByPk.mockResolvedValue(mockLocation);
    Location.findOne.mockResolvedValue(null);
    await locationController.updateLocation(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('updateLocation should return updated for qr_string', async () => {
    req.params.id = 1;
    req.body = { qr_string: 'QR_NEW' };
    const mockLocation = { location_code: 'L1', qr_string: 'QR_OLD', update: jest.fn() };
    Location.findByPk.mockResolvedValue(mockLocation);
    Location.findOne.mockResolvedValue(null); // No existing qr_string
    await locationController.updateLocation(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('deleteLocation should delete', async () => {
    req.params.id = 1;
    const mockLocation = { destroy: jest.fn() };
    Location.findByPk.mockResolvedValue(mockLocation);
    await locationController.deleteLocation(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('createLocation should call next on error', async () => {
    Location.create.mockRejectedValue(new Error('fail'));
    req.body = { location_code: 'L1', qr_string: 'QR1', warehouse: 'W', rack: 'R', bin: 'B' };
    await locationController.createLocation(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('createLocation should return 400 if validation fails', async () => {
    req.body = { location_code: '' }; // Trigger Joi validation fail
    await locationController.createLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createLocation should return 400 if location_code exists', async () => {
    req.body = { location_code: 'L1', qr_string: 'QR1', warehouse: 'W', rack: 'R', bin: 'B' };
    Location.findOne.mockResolvedValueOnce({ id: 1 }); // existing by code
    await locationController.createLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createLocation should return 400 if qr_string exists', async () => {
    req.body = { location_code: 'L1', qr_string: 'QR1', warehouse: 'W', rack: 'R', bin: 'B' };
    Location.findOne
      .mockResolvedValueOnce(null) // pass check by code
      .mockResolvedValueOnce({ id: 1 }); // fail check by QR
    await locationController.createLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next on errors', async () => {
    Location.findAll.mockRejectedValue(new Error('fail'));
    await locationController.getLocations(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('getLocationById should return 400 if location not found', async () => {
    req.params.id = 1;
    Location.findByPk.mockResolvedValue(null);
    await locationController.getLocationById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getLocationById should call next on error', async () => {
    req.params.id = 1;
    Location.findByPk.mockRejectedValue(new Error('fail'));
    await locationController.getLocationById(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('updateLocation should return 400 if validation fails', async () => {
    req.params.id = 1;
    req.body = { location_code: '' }; // Invalid empty string to trigger Joi validation fail
    await locationController.updateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updateLocation should return 400 if location not found', async () => {
    req.params.id = 1;
    req.body = { location_code: 'L1' };
    Location.findByPk.mockResolvedValue(null);
    await locationController.updateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updateLocation should call next on error', async () => {
    req.params.id = 1;
    Location.findByPk.mockRejectedValue(new Error('fail'));
    await locationController.updateLocation(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('updateLocation should return 400 if location_code is already exists', async () => {
    req.params.id = 1;
    req.body = { location_code: 'L2' };
    const mockLocation = { location_code: 'L1' };
    Location.findByPk.mockResolvedValue(mockLocation);
    Location.findOne.mockResolvedValue({ id: 2 }); // existing location_code
    await locationController.updateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updateLocation should return 400 if qr_string is already exists', async () => {
    req.params.id = 1;
    req.body = { qr_string: 'QR2' };
    const mockLocation = { location_code: 'L1', qr_string: 'QR1' };
    Location.findByPk.mockResolvedValue(mockLocation);
    Location.findOne.mockResolvedValue({ id: 2 }); // existing qr_string
    await locationController.updateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deleteLocation should return 400 if location not found', async () => {
    req.params.id = 1;
    Location.findByPk.mockResolvedValue(null);
    await locationController.deleteLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deleteLocation should call next on error', async () => {
    req.params.id = 1;
    Location.findByPk.mockRejectedValue(new Error('fail'));
    await locationController.deleteLocation(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

