// utils/validation.js


const errors = {
  COMPANY_NOT_FOUND: { errorField: 'slug', message: 'Company not found' },
  INVALID_CREDENTIALS: { errorField: 'general', message: 'Invalid email or password' },
  USER_NOT_FOUND: { errorField: 'email', message: 'Incorrect email' },
  INVALID_PASSWORD: { errorField: 'password', message: 'Incorrect password' },

  WEAK_PASSWORD: {
    errorField: 'password',
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, number and special character'
  },

  PASSWORD_REQUIRED: {
    errorField: 'password',
    message: 'Password is required'
  }
};

module.exports = errors;
