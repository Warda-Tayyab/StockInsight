const jwt = require('jsonwebtoken');
const AdminUser = require('../models/shared/AdminUser');

class AuthService {

  static async adminLogin(email, password, meta) {

    // 1️⃣ Admin user dhoondo
    const admin = await AdminUser.findOne({ email });

    if (!admin) {
      throw new Error('Admin not found');
    }

    // 2️⃣ Status check
    if (admin.status !== 'active') {
      throw new Error('Admin account suspended');
    }

    // 3️⃣ Password verify
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid password');
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
