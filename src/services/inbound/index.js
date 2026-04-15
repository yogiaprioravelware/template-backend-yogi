const { createInbound } = require("./create-inbound-service");
const { getInbounds } = require("./get-inbounds-service");
const { getInboundDetail } = require("./get-inbound-detail-service");
const { scanRfidReceived } = require("./scan-rfid-received-service");
const { scanQrStored } = require("./scan-qr-stored-service");
const { finalizeInbound } = require("./finalize-inbound-service");

module.exports = {
  createInbound,
  getInbounds,
  getInboundDetail,
  scanRfidReceived,
  scanQrStored,
  finalizeInbound,
};
