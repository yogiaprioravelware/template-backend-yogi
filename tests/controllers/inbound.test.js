const inboundController = require('../../src/controllers/inbound');
const inboundService = require('../../src/services/inbound');
const response = require('../../src/utils/response');
const { scanItemSchema, setLocationSchema } = require('../../src/validations/inbound-validation');

jest.mock('../../src/services/inbound');
jest.mock('../../src/utils/response', () => ({
  success: jest.fn(data => ({ success: true, data })),
  error: jest.fn(msg => ({ success: false, message: msg }))
}));
jest.mock('../../src/validations/inbound-validation', () => ({
  scanItemSchema: { validate: jest.fn() },
  setLocationSchema: { validate: jest.fn() }
}));
jest.mock('../../src/utils/logger'); // silence

describe('Controller: inbound', () => {
    let req, res, next;
    beforeEach(() => {
        req = { body: {}, params: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // createInbound
    it('createInbound success', async () => {
        inboundService.createInbound.mockResolvedValue({ id: 1 });
        await inboundController.createInbound(req, res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
    });
    it('createInbound error', async () => {
        inboundService.createInbound.mockRejectedValue(new Error('fail'));
        await inboundController.createInbound(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // getInbounds
    it('getInbounds success', async () => {
        inboundService.getInbounds.mockResolvedValue([]);
        await inboundController.getInbounds(req, res, next);
        expect(res.json).toHaveBeenCalled();
    });
    it('getInbounds error', async () => {
        inboundService.getInbounds.mockRejectedValue(new Error('fail'));
        await inboundController.getInbounds(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // getInboundDetail
    it('getInboundDetail success', async () => {
        inboundService.getInboundDetail.mockResolvedValue({});
        await inboundController.getInboundDetail(req, res, next);
        expect(res.json).toHaveBeenCalled();
    });
    it('getInboundDetail error', async () => {
        inboundService.getInboundDetail.mockRejectedValue(new Error('fail'));
        await inboundController.getInboundDetail(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // scanItem
    it('scanItem validation error', async () => {
        scanItemSchema.validate.mockReturnValue({ error: { details: [{ message: 'err' }] } });
        await inboundController.scanItem(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    it('scanItem fail from service', async () => {
        scanItemSchema.validate.mockReturnValue({ value: { rfid_tag: '1' } });
        inboundService.scanItem.mockResolvedValue({ success: false, statusCode: 404 });
        await inboundController.scanItem(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('scanItem success from service', async () => {
        scanItemSchema.validate.mockReturnValue({ value: { rfid_tag: '1' } });
        inboundService.scanItem.mockResolvedValue({ success: true, data: {} });
        await inboundController.scanItem(req, res, next);
        expect(res.json).toHaveBeenCalled();
    });
    it('scanItem error', async () => {
        scanItemSchema.validate.mockReturnValue({ value: { rfid_tag: '1' } });
        inboundService.scanItem.mockRejectedValue(new Error('fail'));
        await inboundController.scanItem(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // setLocation
    it('setLocation validation error', async () => {
        setLocationSchema.validate.mockReturnValue({ error: { details: [{ message: 'err' }] } });
        await inboundController.setLocation(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    it('setLocation missing inbound_item_id', async () => {
        setLocationSchema.validate.mockReturnValue({ value: { qr_string: '1' } });
        req.body.inbound_item_id = null;
        await inboundController.setLocation(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    it('setLocation fail from service', async () => {
        setLocationSchema.validate.mockReturnValue({ value: { qr_string: '1' } });
        req.body.inbound_item_id = 1;
        inboundService.setLocation.mockResolvedValue({ success: false, statusCode: 404 });
        await inboundController.setLocation(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('setLocation success from service', async () => {
        setLocationSchema.validate.mockReturnValue({ value: { qr_string: '1' } });
        req.body.inbound_item_id = 1;
        inboundService.setLocation.mockResolvedValue({ success: true, data: {} });
        await inboundController.setLocation(req, res, next);
        expect(res.json).toHaveBeenCalled();
    });
    it('setLocation error', async () => {
        setLocationSchema.validate.mockReturnValue({ value: { qr_string: '1' } });
        req.body.inbound_item_id = 1;
        inboundService.setLocation.mockRejectedValue(new Error('fail'));
        await inboundController.setLocation(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
