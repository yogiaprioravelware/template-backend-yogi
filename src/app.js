
const express = require("express");
const cors = require("cors");
const userRouter = require("./routers/user");
const itemRouter = require("./routers/item");
const inboundRouter = require("./routers/inbound");
const outboundRouter = require("./routers/outbound");
const roleRouter = require("./routers/role");
const locationRouter = require("./routers/location");
const inventoryRouter = require("./routers/inventory");
const errorMiddleware = require("./middlewares/error-middleware");
const requestLogger = require("./middlewares/request-logger");

const rateLimit = require("express-rate-limit");
const app = express();
app.disable("x-powered-by");

// Rate limiter for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  skip: (req) => process.env.NODE_ENV === "test",
});

app.use(limiter);
app.use(cors({
  origin: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// routes
app.use("/api/users", userRouter);
app.use("/api/items", itemRouter);
app.use("/api/inbounds", inboundRouter);
app.use("/api/outbounds", outboundRouter);
app.use("/api/locations", locationRouter);
app.use("/api/roles", roleRouter);
app.use("/api/inventory", inventoryRouter);

// error handler
app.use(errorMiddleware);

module.exports = app;