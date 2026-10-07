const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');

// 🔹 Password strength checker
const isStrongPassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return regex.test(password);
};

router.post('/accept-invite', async (req, res) => {
  try {
    const { inviteToken, password } = req.body;

    /* ===============================
       1️⃣ Basic Required Validations
    =============================== */
    if (!inviteToken) {
      return res.status(400).json({ message: 'Invite token is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    /* ===============================
       2️⃣ Password Validations
    =============================== */
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      });
    }

    /* ===============================
       3️⃣ Invite Token Validation
    =============================== */
    const tenant = await Tenant.findOne({ inviteToken });

    // ❌ Invalid token
    if (!tenant) {
      return res.status(400).json({ message: 'Invalid invite token' });
    }

    // ❌ Already used
    if (tenant.inviteAccepted) {
      return res.status(400).json({ message: 'Invite already accepted' });
    }

    // ❌ Expired token
    if (tenant.inviteExpiresAt && tenant.inviteExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite token has expired' });
    }

    /* ===============================
       4️⃣ Owner User Validation
    =============================== */
    const owner = await User.findById(tenant.ownerUserId);

    if (!owner) {
      return res.status(400).json({ message: 'Owner user not found' });
    }

    if (owner.passwordHash) {
      return res.status(400).json({ message: 'Password already set for this account' });
    }

    /* ===============================
       5️⃣ Set Password
    =============================== */
    owner.passwordHash = await bcrypt.hash(password, 10);
    await owner.save();

    /* ===============================
       6️⃣ Mark Invite as Used
    =============================== */
    tenant.inviteAccepted = true;
    tenant.inviteToken = null;
    tenant.inviteExpiresAt = null;
    await tenant.save();

    /* ===============================
       7️⃣ Auto Login Token
    =============================== */
    const token = jwt.sign(
      {
        userId: owner._id,
        email: owner.email,
        role: owner.role,
        tenantId: tenant._id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Account activated successfully',
      token,
      user: {
        id: owner._id,
        email: owner.email,
        role: owner.role,
        tenantId: tenant._id
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
