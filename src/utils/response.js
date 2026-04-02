
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

module.exports = {
  success,
  error,
};
