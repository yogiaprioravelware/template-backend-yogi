
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const userRouter = require("./routers/user");
const itemRouter = require("./routers/item");
const inboundRouter = require("./routers/inbound");
const outboundRouter = require("./routers/outbound");
const roleRouter = require("./routers/role");
const locationRouter = require("./routers/location");
const errorMiddleware = require("./middlewares/error-middleware");
const requestLogger = require("./middlewares/request-logger");

const rateLimit = require("express-rate-limit");
const app = express();

// Security Hardening
app.use(helmet());
app.disable("x-powered-by");

// CORS config
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
app.use(cors(corsOptions));

// Specialized limiter for rapid scanning (Inbound/Outbound)
const scannerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 scans per minute per IP
  message: {
    success: false,
    message: "Scanning frequency too high, please wait a moment"
  },
  skip: (req) => process.env.NODE_ENV === "test",
});

// Relaxed global limiter for warehouse operations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, // 1000 requests per 15 minutes
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  skip: (req) => process.env.NODE_ENV === "test",
});

app.use(globalLimiter);

// Specific routes that need higher throughput but still protected
app.use("/api/inbounds/:id/scan-received", scannerLimiter);
app.use("/api/outbounds/:id/scan", scannerLimiter);
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