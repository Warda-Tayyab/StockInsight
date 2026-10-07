const jwt = require('jsonwebtoken');
const AdminUser = require('../models/shared/AdminUser');
const errors = require('../utils/validation');
const logAdminActivity = require('../utils/logAdminActivity');
class AuthService {

  static async adminLogin(email, password, meta) {
 if (!email) {
      throw { status: 400, ...errors.USER_NOT_FOUND};
     
    }

    if (!password) {
      throw { status: 400, ...errors.INVALID_PASSWORD  };
    }
    // 1️⃣ Admin user dhoondo
    const admin = await AdminUser.findOne({ email });

    if (!admin) {
      throw { status: 400, ...errors.USER_NOT_FOUND };
    }

    // 2️⃣ Status check
    if (admin.status !== 'active') {
      throw { status: 403, errorField: 'general', message: 'Admin account suspended' };
    }

    // 3️⃣ Password verify
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw { status: 400, ...errors.INVALID_PASSWORD };
    }

    // 4️⃣ JWT token banao
    const token = jwt.sign(
      {
        adminId: admin._id,
        role: admin.role,
        isSuperAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    await logAdminActivity({
      type: 'super_admin_login',
      title: 'Super admin login',
      description: 'Administrator signed in successfully',
      entityType: 'admin',
      entityId: admin._id,
      metadata: {
        email: admin.email,
        role: admin.role,
        ip: meta?.ip || 'unknown',
        userAgent: meta?.userAgent?.slice(0, 120) || 'unknown'
      }
    });

    // 5️⃣ Response bhejo
    return {
      message: 'Super admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    };
  }
}

module.exports = AuthService;
