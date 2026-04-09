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
        req = { body: {}, params: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    ['createOutbound', 'getOutbounds', 'getOutboundDetail', 'scanRfidPicking'].forEach(method => {
        it(`${method} success`, async () => {
            outboundService[method].mockResolvedValue({});
            await outboundController[method](req, res, next);
            if(method === 'createOutbound') expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();
        });
        it(`${method} error`, async () => {
            outboundService[method].mockRejectedValue(new Error('fail'));
            await outboundController[method](req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
