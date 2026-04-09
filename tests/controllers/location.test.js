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

  it('deleteLocation should delete', async () => {
    req.params.id = 1;
    const mockLocation = { destroy: jest.fn() };
    Location.findByPk.mockResolvedValue(mockLocation);
    await locationController.deleteLocation(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('should call next on errors', async () => {
    Location.findAll.mockRejectedValue(new Error('fail'));
    await locationController.getLocations(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

