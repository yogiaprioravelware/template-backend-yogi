const inboundController = require('../../src/controllers/inbound');
const inboundService = require('../../src/services/inbound');
const response = require('../../src/utils/response');

jest.mock('../../src/services/inbound');
jest.mock('../../src/utils/response', () => ({
  success: jest.fn((data, msg, extra) => ({ success: true, data, message: msg, ...extra })),
  error: jest.fn((msg, details, statusCode) => ({ success: false, message: msg, errors: details || [], statusCode: statusCode || 500 }))
}));
jest.mock('../../src/utils/logger');

describe('Controller: inbound', () => {
    let req, res, next;
    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // createInbound
    it('createInbound success', async () => {
        inboundService.createInbound.mockResolvedValue({ id: 1 });
        await inboundController.createInbound(req, res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('createInbound error', async () => {
        inboundService.createInbound.mockRejectedValue(new Error('fail'));
        await inboundController.createInbound(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // getInbounds
    it('getInbounds success', async () => {
        inboundService.getInbounds.mockResolvedValue({ data: [], pagination: {} });
        await inboundController.getInbounds(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
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
    it('scanItem success from service', async () => {
        req.params.inboundId = 1;
        req.body.rfid_tag = 'RFID1';
        inboundService.scanItem.mockResolvedValue({ data: { id: 10 } });
        await inboundController.scanItem(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('scanItem fail from service (legacy return pattern)', async () => {
        inboundService.scanItem.mockResolvedValue({ success: false, statusCode: 404, message: 'Not found' });
        await inboundController.scanItem(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('scanItem fail from service without statusCode should fallback to 400', async () => {
        inboundService.scanItem.mockResolvedValue({ success: false, message: 'Bad request' });
        await inboundController.scanItem(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanItem error', async () => {
        inboundService.scanItem.mockRejectedValue(new Error('fail'));
        await inboundController.scanItem(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // setLocation
    it('setLocation success from service', async () => {
        req.params.inboundId = 1;
        req.body = { inbound_item_id: 1, qr_string: 'LOC1' };
        inboundService.setLocation.mockResolvedValue({ data: { id: 20 } });
        await inboundController.setLocation(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('setLocation fail from service', async () => {
        inboundService.setLocation.mockResolvedValue({ success: false, statusCode: 400, message: 'Invalid location' });
        await inboundController.setLocation(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('setLocation fail from service without statusCode should fallback to 400', async () => {
        inboundService.setLocation.mockResolvedValue({ success: false, message: 'Invalid location' });
        await inboundController.setLocation(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('setLocation error', async () => {
        inboundService.setLocation.mockRejectedValue(new Error('fail'));
        await inboundController.setLocation(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
