const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');

router.post('/accept-invite', async (req, res) => {
  try {
    const { inviteToken, password } = req.body;

    if (!inviteToken || !password) {
      return res.status(400).json({ message: 'Invite token and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // 1️⃣ Tenant find by invite token
    const tenant = await Tenant.findOne({ inviteToken });
    if (!tenant) {
      return res.status(400).json({ message: 'Invalid or expired invite token' });
    }

    // 2️⃣ Check already accepted
    if (tenant.inviteAccepted) {
      return res.status(400).json({ message: 'Invite already accepted' });
    }

    // 3️⃣ Owner user fetch
    const owner = await User.findById(tenant.ownerUserId);
    if (!owner) {
      return res.status(400).json({ message: 'Owner user not found' });
    }

    // 4️⃣ Set password
    owner.passwordHash = await bcrypt.hash(password, 10);
    await owner.save();

    // 5️⃣ Mark invite as used
    tenant.inviteAccepted = true;
    tenant.inviteToken = null; // 🔐 very important
    await tenant.save();

    // 6️⃣ (Optional but recommended) Auto login token
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

    res.json({
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
