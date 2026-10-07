const express = require('express');
const router = express.Router();
const User = require('../models/tenant/User');
const bcrypt = require('bcrypt');
const Tenant = require('../models/shared/Tenant');
const { sendActivationEmail } = require('../utils/sendEmail'); 

router.post('/activate', async (req, res) => {
  const { email, slug, code, newPassword } = req.body;

const tenant = await Tenant.findOne({ slug });
if (!tenant) return res.status(404).json({ message: 'Company not found' });

const user = await User.findOne({ email, tenantId: tenant._id });
console.log("DB Code:", user.activationCode);
console.log("Entered Code:", code);
console.log("Expire Time:", user.activationCodeExpire);
console.log("Current Time:", Date.now());
  if (
  !user.activationCode ||
  user.activationCode !== String(code) ||
  Date.now() > user.activationCodeExpire
) {
    return res.status(400).json({ message: 'Invalid or expired activation code' });
  }

  // Set new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordSet = true;
  user.isActivated = true;
  user.status = 'active';
  user.activationCode = null;
  user.activationCodeExpire = null;

  await user.save();

  res.json({ message: 'Account activated successfully. You can now login.' });
});

// ✅ Resend OTP route
router.post('/resend-otp', async (req, res) => {
  const { email, slug } = req.body;

  if (!email || !slug) return res.status(400).json({ message: 'Email and company slug are required' });

  const tenant = await Tenant.findOne({ slug });
  if (!tenant) return res.status(404).json({ message: 'Company not found' });

  const user = await User.findOne({ email, tenantId: tenant._id });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Generate new activation code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.activationCode = code;
  user.activationCodeExpire = Date.now() + 15 * 60 * 1000; // 15 min
  await user.save();

  try {
   await sendActivationEmail(user, code, tenant);
  } catch (err) {
    console.error('Activation email failed:', err);
    return res.status(500).json({ message: 'Failed to send activation email' });
  }

  res.json({ message: 'Activation code resent successfully' });
});

module.exports = router;