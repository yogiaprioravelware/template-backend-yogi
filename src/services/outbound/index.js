const createOutbound = require("./create-outbound-service");
const getOutbounds = require("./get-outbounds-service");
const getOutboundDetail = require("./get-outbound-detail-service");
const { scanQrPicking } = require("./scan-qr-picking-service");
const { scanRfidStaging } = require("./scan-rfid-staging-service");
const { finalizeOutbound } = require("./finalize-outbound-service");

module.exports = {
  createOutbound,
  getOutbounds,
  getOutboundDetail,
  scanQrPicking,
  scanRfidStaging,
  finalizeOutbound,
};
