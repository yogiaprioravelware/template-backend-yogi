const { createInbound } = require("./create-inbound-service");
const { getInbounds } = require("./get-inbounds-service");
const { getInboundDetail } = require("./get-inbound-detail-service");
const { scanItem } = require("./scan-item-service");
const { setLocation } = require("./set-location-service");

module.exports = {
  createInbound,
  getInbounds,
  getInboundDetail,
  scanItem,
  setLocation,
};
