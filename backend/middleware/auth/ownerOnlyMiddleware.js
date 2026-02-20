const Tenant = require('../../models/shared/Tenant');

module.exports = async function ownerOnly(req, res, next) {
  try {
    // 1️⃣ Auth check (safety)
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 2️⃣ Role check
    if (req.auth.role !== 'owner') {
      return res.status(403).json({ message: 'Only company owner allowed' });
    }

    // 3️⃣ Tenant status check
    const tenant = await Tenant.findById(req.auth.tenantId);
    if (!tenant || tenant.status !== 'active') {
     return res.status(403).json({ message: 'Company account inactive' });
    }

    req.tenant = tenant; // optional but useful
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Authorization failed' });
  }
};
