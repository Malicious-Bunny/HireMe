const validator = require('validator');

// Validate email
exports.isValidEmail = (email) => {
  return validator.isEmail(email);
};

// Validate password (minimum 8 characters)
exports.isValidPassword = (password) => {
  return password.length >= 8;
};
