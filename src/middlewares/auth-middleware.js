
const jwt = require("jsonwebtoken");
const response = require("../utils/response");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json(response.error("Authentication invalid"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
      id: payload.id,
      role: payload.role,
      role_id: payload.role_id 
    };
    next();
  } catch (error) {
    return res.status(401).json(response.error("Authentication invalid"));
  }
};

module.exports = authMiddleware;
