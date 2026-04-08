
const express = require("express");
const cors = require("cors");
const userRouter = require("./routers/user");
const itemRouter = require("./routers/item");
const inboundRouter = require("./routers/inbound");
const outboundRouter = require("./routers/outbound");
const roleRouter = require("./routers/role");
const locationRouter = require("./routers/location");
const path = require("node:path");
const errorMiddleware = require("./middlewares/error-middleware");
const requestLogger = require("./middlewares/request-logger");

const app = express();
app.disable("x-powered-by");

app.use(cors({
  origin: true, // Allow all origins for the testing phase
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/src", express.static(path.join(__dirname, "../frontend/src")));

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