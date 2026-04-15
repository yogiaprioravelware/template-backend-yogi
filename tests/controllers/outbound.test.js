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

    ['createOutbound', 'getOutbounds', 'getOutboundDetail', 'scanRfidPicking', 'finalizeOrderSync'].forEach(method => {
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

    it('scanRfidPicking fail from service', async () => {
        outboundService.scanRfidPicking.mockResolvedValue({ success: false, statusCode: 400, message: 'Invalid RFID' });
        await outboundController.scanRfidPicking(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('scanRfidPicking fail from service without statusCode should fallback to 400', async () => {
        outboundService.scanRfidPicking.mockResolvedValue({ success: false, message: 'Invalid RFID' });
        await outboundController.scanRfidPicking(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('finalizeOrderSync fail from service', async () => {
        outboundService.finalizeOrderSync.mockResolvedValue({ success: false, statusCode: 404, message: 'Not found' });
        await outboundController.finalizeOrderSync(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('finalizeOrderSync fail from service without statusCode should fallback to 400', async () => {
        outboundService.finalizeOrderSync.mockResolvedValue({ success: false, message: 'Not found' });
        await outboundController.finalizeOrderSync(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
