const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Tenant = require('../models/shared/Tenant');
const User = require('../models/tenant/User');
const adminAuthMiddleware = require('../middleware/auth/adminAuthMiddleware');

router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const {
      name,
      slug,
      ownerEmail,
      ownerFirstName,
      ownerLastName,
      primaryContact,
      business
    } = req.body;

   
if (!ownerFirstName) {
  return res.status(400).json({
    message: 'Owner first name is required'
  });
}

if (!ownerEmail) {
  return res.status(400).json({
    message: 'Owner email is required'
  });
}

    // 1️⃣ Invite token generate
    const inviteToken = crypto.randomBytes(20).toString('hex');
 

    const existing = await Tenant.findOne({ slug });
if (existing) {
  return res.status(400).json({ message: 'Slug already exists, use a different one' });
}
    // 2️⃣ Tenant create
    const tenant = await Tenant.create({
      tenantId: crypto.randomUUID(),
      name,
      slug,
      ownerEmail,
      inviteToken,
      primaryContact,
      business
    });

    let passwordHash = null;

if (req.body.setPasswordNow && req.body.password) {
  passwordHash = await bcrypt.hash(req.body.password, 10);
}

// Owner user create
const owner = new User({
  tenantId: tenant._id,
  firstName: ownerFirstName,
  lastName: ownerLastName,
  email: ownerEmail,
  role: 'owner',
  passwordHash,              // null OR hashed password
  status: passwordHash ? 'active' : 'invited'
});

await owner.save();


    // 4️⃣ Link owner to tenant
    tenant.ownerUserId = owner._id;
    await tenant.save();

    // 5️⃣ Response (later send email invite)
    res.json({
      message: 'Tenant created, owner invite token generated',
      tenant,
      inviteToken
    });

  }
  catch (error) {

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);

    return res.status(400).json({
      message: messages
    });
  }

  res.status(500).json({ message: 'Server error' });
}
 
});

module.exports = router;
