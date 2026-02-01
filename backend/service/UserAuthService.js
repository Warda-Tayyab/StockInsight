const jwt = require('jsonwebtoken');
const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');

class UserAuthService {

static async login(email, password, slug) {
   // 1️⃣ Tenant find by slug
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) {
      throw { status: 401, message: 'Company not found' };
    }
        // 2️⃣ User find under tenant
        
const user = await User.findOne({
  email,
  tenantId: tenant._id
});
 // 3️⃣ Email or password invalid
    if (!user || !(await user.comparePassword(password))) {
      throw { status: 401, message: 'Invalid credentials' };
    }

  
   

    if (user.status !== 'active') {
      throw new Error('User account suspended');
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
