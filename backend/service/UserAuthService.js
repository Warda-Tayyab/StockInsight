const jwt = require('jsonwebtoken');
const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');
const errors = require('../utils/validation');
const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { 
  sendActivationEmail,
  sendResetPasswordEmail 
} = require('../utils/sendEmail');
const LoginHistory = require('../models/tenant/LoginHistory');
const logAdminActivity = require('../utils/logAdminActivity');

const recordLoginHistory = async (user, method = 'password', meta = {}) => {
  try {
    const parser = new UAParser(meta.userAgent);
    const result = parser.getResult();

    const browser = result.browser.name || 'Unknown Browser';
    const os = result.os.name || 'Unknown OS';
    const device =
      result.device.vendor && result.device.model
        ? `${result.device.vendor} ${result.device.model}`
        : result.device.type === 'mobile'
        ? 'Mobile'
        : 'Desktop';

    await LoginHistory.create({
      tenantId: user.tenantId,
      userId: user._id,
      email: user.email,
      method,
      ip: meta.ip || '',
      userAgent: meta.userAgent || '',
      deviceName: `${device} • ${browser} `
    });
  } catch (err) {
    console.warn('Login history write failed:', err.message);
  }
};

const logTenantUserLogin = async (user, tenant) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  await logAdminActivity({
    type: 'tenant_user_login',
    title: 'Tenant user login',
    description: `${name} signed in to ${tenant.name}`,
    entityType: 'user',
    entityId: user._id,
    metadata: {
      email: user.email,
      role: user.role,
      tenantName: tenant.name,
      tenantSlug: tenant.slug
    }
  });
};
class UserAuthService {
static async googleLogin(token, slug, meta = {}) {
  try {

    const tenant = await Tenant.findOne({ slug });
    if (!tenant) return errors.COMPANY_NOT_FOUND;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const { email, given_name, family_name, sub } = payload;

    // Check if user exists
    let user = await User.findOne({ email, tenantId: tenant._id });

    if (!user) {
      // Google sign-in only for already-invited users
      return {
        status: 403,
        errorField: 'invite',
        message: 'No account found. Ask your owner/manager to invite you by email first.',
      };
    }

    if (user.status === 'suspended') {
      return errors.ACCOUNT_SUSPENDED;
    }

    // Link Google identity to invited/local account
    user.googleId = sub;
    user.authProvider = user.authProvider === 'local' && user.passwordSet ? 'local' : 'google';
    if (!user.isActivated) {
      user.isActivated = true;
      user.status = 'active';
      user.activationCode = null;
      user.activationCodeExpire = null;
    }
    if (!user.firstName && given_name) user.firstName = given_name;
    if (!user.lastName && family_name) user.lastName = family_name;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    await logTenantUserLogin(user, tenant);
    await recordLoginHistory(user, 'google', meta);

    return {
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        themePreference: user.themePreference || 'system',
        tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug }
      }
    };

  } catch (err) {
    console.error('Google login error:', err);
    return { status: 401, errorField: 'general', message: 'Google authentication failed' };
  }
}
  static async login(email, password, slug, meta = {}) {
    try {
      const tenant = await Tenant.findOne({ slug: slug.trim() });
      if (!tenant) return errors.COMPANY_NOT_FOUND;

      const user = await User.findOne({ email, tenantId: tenant._id });
      if (!user) return errors.USER_NOT_FOUND;

      const isMatch = await user.comparePassword(password);
      user.lastLoginAt = new Date();
      await user.save();
      if (!isMatch) return errors.INVALID_PASSWORD;

      // 🔹 Activation check FIRST
      if (!user.isActivated) {

        if (!user.activationCode || Date.now() > user.activationCodeExpire) {

          const code = Math.floor(100000 + Math.random() * 900000).toString();

          user.activationCode = code;
          user.activationCodeExpire = Date.now() + 15 * 60 * 1000;

          await user.save();

          try {
            await sendActivationEmail(user, code, tenant);
          } catch (err) {
            console.error('Activation email failed:', err);
          }
        }

        return {
          status: 403,
          errorField: 'activation',
          message: 'Activation required. Check your email for the code.'
        };
      }

      // 🔹 Then check status
      if (user.status === 'suspended') {
        return errors.ACCOUNT_SUSPENDED;
      }

      // 🔹 JWT Token
      const token = jwt.sign(
        { userId: user._id, role: user.role, tenantId: user.tenantId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      await logTenantUserLogin(user, tenant);
      await recordLoginHistory(user, 'password', meta);

      return {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          themePreference: user.themePreference || 'system',
          tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug }
        }
      };

    } catch (err) {
      console.error('Login function error:', err);
      return { status: 500, errorField: 'general', message: 'Login failed due to server error.' };
    }
  }


  // ✅ FORGOT PASSWORD
  static async forgotPassword(email, slug) {

    const tenant = await Tenant.findOne({ slug });
    if (!tenant) return errors.COMPANY_NOT_FOUND;

    const user = await User.findOne({ email, tenantId: tenant._id });
    if (!user) return errors.USER_NOT_FOUND;

    const token = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendResetPasswordEmail(user, token, tenant);

    return { message: "Password reset email sent" };
  }


  // ✅ RESET PASSWORD
  static async resetPassword(token, password) {

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return {
        status: 400,
        errorField: 'token',
        message: 'Invalid or expired reset token'
      };
    }
    try {
      await user.setPassword(password);
    } catch (err) {
      return err; // already contains errorField + message
    }
    //await user.setPassword(password);
  
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return { message: "Password reset successful" };
  }

}

module.exports = UserAuthService;