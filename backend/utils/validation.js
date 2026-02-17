// utils/validation.js


const errors = {
  COMPANY_NOT_FOUND: { errorField: 'slug', message: 'Company not found' },
  INVALID_CREDENTIALS: { errorField: 'general', message: 'Invalid email or password' },
  USER_NOT_FOUND: { errorField: 'email', message: 'Incorrect email' },
  INVALID_PASSWORD: { errorField: 'password', message: 'Incorrect password' }
};

module.exports = errors;
