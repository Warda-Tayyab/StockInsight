// ==========================================
// AUTH + ROLE + TENANT SECURITY MIDDLEWARE
// Clean, scalable, reusable
// ==========================================

const jwt = require('jsonwebtoken');
const Tenant = require('../../models/shared/Tenant');

/**
 * ==========================================
 * 1️⃣ AUTHENTICATE → Verify JWT and attach user
 * ==========================================
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔒 Check token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Unauthorized: Token missing'
      });
    }

    const token = authHeader.split(' ')[1];

    // 🔒 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.auth = decoded; // attach user data
    next();

  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized: Invalid or expired token'
    });
  }
};


/**
 * ==========================================
 * 2️⃣ AUTHORIZE → Role + tenant + admin check
 * ==========================================
 * options:
 * roles → ['owner', 'admin']
 * requireSuperAdmin → true
 * requireTenantActive → true
 */
const authorize = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.auth) {
        return res.status(401).json({
          message: 'Unauthorized: Please login first'
        });
      }

      const {
        roles = [],
        requireSuperAdmin = false,
        requireTenantActive = false
      } = options;


      /**
       * 🔹 ROLE CHECK
       */
      if (roles.length && !roles.includes(req.auth.role)) {
        return res.status(403).json({
          message: 'Forbidden: You do not have permission'
        });
      }


      /**
       * 🔹 SUPER ADMIN CHECK
       */
      if (requireSuperAdmin && !req.auth.isSuperAdmin) {
        return res.status(403).json({
          message: 'Forbidden: Super admin only'
        });
      }


      /**
       * 🔹 TENANT ACTIVE CHECK
       */
      if (requireTenantActive) {
        const tenant = await Tenant.findById(req.auth.tenantId);

        if (!tenant) {
          return res.status(404).json({
            message: 'Tenant not found'
          });
        }

        if (tenant.status !== 'active') {
          return res.status(403).json({
            message: 'Company account inactive. Contact support.'
          });
        }

        req.tenant = tenant; // optional for controllers
      }

      next();

    } catch (error) {
      return res.status(500).json({
        message: 'Authorization failed'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize
};
