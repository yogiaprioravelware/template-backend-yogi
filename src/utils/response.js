
const success = (data) => {
  return {
    success: true,
    data,
  };
};

const error = (errors) => {
  const errorArray = Array.isArray(errors) ? errors : [{ message: errors }];
  return {
    success: false,
    errors: errorArray,
  };
};

const successResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};

const errorResponse = (statusCode, message, details = {}) => {
  return {
    success: false,
    statusCode,
    message,
    ...details,
  };
};

module.exports = {
  success,
  error,
  successResponse,
  errorResponse,
};
