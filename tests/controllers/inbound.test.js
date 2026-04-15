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

    // scanRfidReceived
    it('scanRfidReceived success from service with req.user', async () => {
        req.params.inboundId = 1;
        req.body = { rfid_tag: 'RFID1', location_id: 10 };
        req.user = { id: 100 };
        inboundService.scanRfidReceived.mockResolvedValue({ data: { id: 10 } });
        await inboundController.scanRfidReceived(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(inboundService.scanRfidReceived).toHaveBeenCalledWith(1, 'RFID1', 10, 100);
    });

    it('scanRfidReceived success from service without req.user', async () => {
        req.params.inboundId = 1;
        req.body = { rfid_tag: 'RFID1', location_id: 10 };
        inboundService.scanRfidReceived.mockResolvedValue({ data: { id: 10 } });
        await inboundController.scanRfidReceived(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(inboundService.scanRfidReceived).toHaveBeenCalledWith(1, 'RFID1', 10, null);
    });

    it('scanRfidReceived fail from service (legacy return pattern)', async () => {
        inboundService.scanRfidReceived.mockResolvedValue({ success: false, statusCode: 404, message: 'Not found' });
        await inboundController.scanRfidReceived(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('scanRfidReceived fail from service without statusCode should fallback to 400', async () => {
        inboundService.scanRfidReceived.mockResolvedValue({ success: false, message: 'Bad request' });
        await inboundController.scanRfidReceived(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanRfidReceived error', async () => {
        inboundService.scanRfidReceived.mockRejectedValue(new Error('fail'));
        await inboundController.scanRfidReceived(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    // scanQrStored
    it('scanQrStored success from service with req.user', async () => {
        req.body = { rfid_tag: 'RFID1', qr_string: 'LOC1' };
        req.user = { id: 100 };
        inboundService.scanQrStored.mockResolvedValue({ data: { id: 20 } });
        await inboundController.scanQrStored(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(inboundService.scanQrStored).toHaveBeenCalledWith('LOC1', 'RFID1', 100);
    });

    it('scanQrStored success from service without req.user', async () => {
        req.body = { rfid_tag: 'RFID1', qr_string: 'LOC1' };
        inboundService.scanQrStored.mockResolvedValue({ data: { id: 20 } });
        await inboundController.scanQrStored(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(inboundService.scanQrStored).toHaveBeenCalledWith('LOC1', 'RFID1', null);
    });

    it('scanQrStored fail from service', async () => {
        inboundService.scanQrStored.mockResolvedValue({ success: false, statusCode: 400, message: 'Invalid location' });
        await inboundController.scanQrStored(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanQrStored fail from service without statusCode should fallback to 400', async () => {
        inboundService.scanQrStored.mockResolvedValue({ success: false, message: 'Invalid location' });
        await inboundController.scanQrStored(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanQrStored error', async () => {
        inboundService.scanQrStored.mockRejectedValue(new Error('fail'));
        await inboundController.scanQrStored(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
