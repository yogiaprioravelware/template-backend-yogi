
const express = require("express");
const userRouter = require("./routers/user");
const itemRouter = require("./routers/item");
const inboundRouter = require("./routers/inbound");
const outboundRouter = require("./routers/outbound");
const roleRouter = require("./routers/role");
const locationRouter = require("./routers/location");
const errorMiddleware = require("./middlewares/error-middleware");
const requestLogger = require("./middlewares/request-logger");

const app = express();

app.use(express.json());
app.use(requestLogger);

// routes
app.use("/api/users", userRouter);
app.use("/api/items", itemRouter);
app.use("/api/inbounds", inboundRouter);
app.use("/api/outbounds", outboundRouter);
app.use("/api/locations", locationRouter);
app.use("/api/roles", roleRouter);

// error handler
app.use(errorMiddleware);

module.exports = app;