
const success = (data, message = "Operation successful", extra = {}) => {
  return {
    success: true,
    message,
    data,
    ...extra
  };
};

const error = (message = "An error occurred", details = null, statusCode = 500) => {
  let errors = [];
  if (Array.isArray(details)) {
    errors = details;
  } else if (details) {
    errors = [details];
  }

  return {
    success: false,
    message,
    errors,
    statusCode
  };
};

module.exports = {
  success,
  error,
  // Aliases for enterprise standard / backward compatibility
  successResponse: success,
  errorResponse: (statusCode, message, details) => error(message, details, statusCode),
};
