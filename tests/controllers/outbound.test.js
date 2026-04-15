const outboundController = require('../../src/controllers/outbound');
const outboundService = require('../../src/services/outbound');
const response = require('../../src/utils/response');

jest.mock('../../src/services/outbound');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/response', () => ({
  success: jest.fn(data => ({ success: true, data })),
  error: jest.fn(msg => ({ success: false, message: msg }))
}));

describe('Controller: outbound', () => {
    let req, res, next;
    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    ['createOutbound', 'getOutbounds', 'getOutboundDetail', 'scanQrPicking', 'scanRfidStaging', 'finalizeOutbound'].forEach(method => {
        it(`${method} success`, async () => {
            if (method === 'getOutbounds') {
               outboundService[method].mockResolvedValue({ data: [], pagination: {} });
            } else {
               outboundService[method].mockResolvedValue({});
            }
            await outboundController[method](req, res, next);
            if(method === 'createOutbound') expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
        it(`${method} error`, async () => {
            outboundService[method].mockRejectedValue(new Error('fail'));
            await outboundController[method](req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    it('scanQrPicking fail from service', async () => {
        outboundService.scanQrPicking.mockResolvedValue({ success: false, statusCode: 400, message: 'Invalid RFID' });
        await outboundController.scanQrPicking(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanQrPicking fail from service without statusCode should fallback to 400', async () => {
        outboundService.scanQrPicking.mockResolvedValue({ success: false, message: 'Invalid RFID' });
        await outboundController.scanQrPicking(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanRfidStaging fail from service without statusCode should fallback to 400', async () => {
        outboundService.scanRfidStaging.mockResolvedValue({ success: false, message: 'Invalid RFID' });
        await outboundController.scanRfidStaging(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanRfidStaging fail from service with null result', async () => {
        outboundService.scanRfidStaging.mockResolvedValue(null);
        await outboundController.scanRfidStaging(req, res, next);
        expect(res.json).toHaveBeenCalled();
    });

    it('finalizeOutbound success from service with req.user', async () => {
        req.params.id = 1;
        req.user = { id: 100 };
        outboundService.finalizeOutbound.mockResolvedValue({ success: true });
        await outboundController.finalizeOutbound(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(outboundService.finalizeOutbound).toHaveBeenCalledWith(1, 100);
    });

    it('finalizeOutbound success from service without req.user', async () => {
        req.params.id = 1;
        outboundService.finalizeOutbound.mockResolvedValue({ success: true });
        await outboundController.finalizeOutbound(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(outboundService.finalizeOutbound).toHaveBeenCalledWith(1, undefined);
    });

    it('finalizeOutbound fail from service', async () => {
        outboundService.finalizeOutbound.mockResolvedValue({ success: false, statusCode: 404, message: 'Not found' });
        await outboundController.finalizeOutbound(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('finalizeOutbound fail from service without statusCode should fallback to 400', async () => {
        outboundService.finalizeOutbound.mockResolvedValue({ success: false, message: 'Not found' });
        await outboundController.finalizeOutbound(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
