const jwt = require('jsonwebtoken');
const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');
const errors = require('../utils/validation');
class UserAuthService {

static async login(email, password, slug) {
  const tenant = await Tenant.findOne({ slug: slug.trim() });
  if (!tenant) {
    return errors.COMPANY_NOT_FOUND;
}
    
    const user = await User.findOne({
    email,
    tenantId: tenant._id
  });
 
 if (!user) {
  return errors.USER_NOT_FOUND;
    }
const isMatch = await user.comparePassword(password);
if (!isMatch) {
  return errors.INVALID_PASSWORD;
}
   

if (user.status !== 'active') {
  return errors.ACCOUNT_SUSPENDED;
}
    
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
         tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug
        }
      }
    };
  }
}

module.exports = UserAuthService;
