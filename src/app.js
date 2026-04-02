
const express = require("express");
const userRouter = require("./routers/user");
const errorMiddleware = require("./middlewares/error-middleware");

const app = express();

app.use(express.json());

// routes
app.use("/api/users", userRouter);

// error handler
app.use(errorMiddleware);

module.exports = app;
