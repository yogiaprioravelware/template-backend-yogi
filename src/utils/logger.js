
const { createLogger, transports, format } = require("winston");

const customLevels = {
  levels: {
    error: 0,
    info: 1,
    warn: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    info: "green",
    warn: "yellow",
    http: "magenta",
    debug: "white",
  },
};

const logger = createLogger({
  levels: customLevels.levels,
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

module.exports = logger;
