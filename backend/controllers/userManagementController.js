const crypto = require('crypto');
const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');
const EmailConfig = require('../models/tenant/EmailConfig');
const { sendTeamInviteEmail } = require('../utils/sendEmail');
const { INVITABLE_ROLES, ROLE_LABELS, ROLES } = require('../utils/roles');

const generateActivationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sanitizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role === 'staff' ? 'cashier' : user.role,
  status: user.status,
  isActivated: user.isActivated,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * GET /api/users/manage
 * List all users in the current tenant
 */
const listUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.auth.tenantId })
      .select('-passwordHash -resetPasswordToken -activationCode -inviteToken')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users.map(sanitizeUser),
    });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ message: 'Failed to load users' });
  }
};

/**
 * POST /api/users/manage/invite
 * Invite manager or cashier by email
 */
const inviteUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role } = req.body;
    const tenantId = req.auth.tenantId;

    if (!email || !firstName || !role) {
      return res.status(400).json({ message: 'Email, first name, and role are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const inviteRole = String(role).trim().toLowerCase();

    if (!INVITABLE_ROLES.includes(inviteRole)) {
      return res.status(400).json({
        message: 'You can only invite Manager or Cashier roles',
      });
    }

    if (inviteRole === ROLES.OWNER) {
      return res.status(403).json({ message: 'Cannot invite another owner' });
    }

    // Only owners can invite managers; managers can invite cashiers
    if (inviteRole === ROLES.MANAGER && req.auth.role !== ROLES.OWNER) {
      return res.status(403).json({ message: 'Only owners can invite managers' });
    }

    const existing = await User.findOne({ email: normalizedEmail, tenantId });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const code = generateActivationCode();
    const inviteToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      tenantId,
      firstName: String(firstName).trim(),
      lastName: lastName ? String(lastName).trim() : '',
      email: normalizedEmail,
      role: inviteRole,
      status: 'invited',
      isActivated: false,
      passwordSet: false,
      inviteToken,
      activationCode: code,
      activationCodeExpire: Date.now() + 15 * 60 * 1000,
    });

    try {
      const emailConfig = await EmailConfig.findOne({ tenantId: req.auth.tenantId });
      await sendTeamInviteEmail(user, code, tenant, ROLE_LABELS[inviteRole] || inviteRole, emailConfig);
    } catch (emailErr) {
      console.error('Invite email failed:', emailErr);
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        message: 'User created but invite email failed. Check SMTP settings and try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: `Invite sent to ${normalizedEmail}`,
      data: sanitizeUser(user),
    });
  } catch (err) {
    console.error('inviteUser error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
    res.status(500).json({ message: err.message || 'Failed to invite user' });
  }
};

/**
 * POST /api/users/manage/:id/resend-invite
 */
const resendInvite = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === ROLES.OWNER) {
      return res.status(403).json({ message: 'Cannot resend invite for owner' });
    }

    if (user.isActivated && user.status === 'active') {
      return res.status(400).json({ message: 'User is already activated' });
    }

    const tenant = await Tenant.findById(req.auth.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const code = generateActivationCode();
    user.activationCode = code;
    user.activationCodeExpire = Date.now() + 15 * 60 * 1000;
    user.status = 'invited';
    user.isActivated = false;
    if (!user.inviteToken) {
      user.inviteToken = crypto.randomBytes(32).toString('hex');
    }
    await user.save();

    const roleLabel = ROLE_LABELS[user.role] || user.role;
    try {
      const emailConfig = await EmailConfig.findOne({ tenantId: req.auth.tenantId });
      await sendTeamInviteEmail(user, code, tenant, roleLabel, emailConfig);
    } catch (emailErr) {
      console.error('Resend invite email failed:', emailErr);
      return res.status(500).json({ message: 'Failed to send invite email' });
    }

    res.json({ success: true, message: 'Invite email resent successfully' });
  } catch (err) {
    console.error('resendInvite error:', err);
    res.status(500).json({ message: 'Failed to resend invite' });
  }
};

/**
 * PATCH /api/users/manage/:id
 * Update role or status (suspend/activate)
 */
const updateUser = async (req, res) => {
  try {
    const { role, status, firstName, lastName } = req.body;
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === ROLES.OWNER) {
      return res.status(403).json({ message: 'Owner account cannot be modified here' });
    }

    if (String(user._id) === String(req.auth.userId)) {
      return res.status(403).json({ message: 'You cannot modify your own account here' });
    }

    if (role !== undefined) {
      const nextRole = String(role).trim().toLowerCase();
      if (!INVITABLE_ROLES.includes(nextRole)) {
        return res.status(400).json({ message: 'Invalid role. Use manager or cashier.' });
      }
      if (nextRole === ROLES.MANAGER && req.auth.role !== ROLES.OWNER) {
        return res.status(403).json({ message: 'Only owners can assign manager role' });
      }
      user.role = nextRole;
    }

    if (status !== undefined) {
      const nextStatus = String(status).trim().toLowerCase();
      if (!['active', 'suspended', 'invited'].includes(nextStatus)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      if (nextStatus === 'active' && !user.isActivated) {
        return res.status(400).json({
          message: 'User must activate via email invite before becoming active',
        });
      }
      user.status = nextStatus;
    }

    if (firstName !== undefined) user.firstName = String(firstName).trim();
    if (lastName !== undefined) user.lastName = String(lastName).trim();

    await user.save();

    res.json({
      success: true,
      message: 'User updated',
      data: sanitizeUser(user),
    });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

/**
 * DELETE /api/users/manage/:id
 * Soft-remove invited users or hard-delete non-owners
 */
const removeUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === ROLES.OWNER) {
      return res.status(403).json({ message: 'Cannot remove the owner account' });
    }

    if (String(user._id) === String(req.auth.userId)) {
      return res.status(403).json({ message: 'You cannot remove yourself' });
    }

    if (user.role === ROLES.MANAGER && req.auth.role !== ROLES.OWNER) {
      return res.status(403).json({ message: 'Only owners can remove managers' });
    }

    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    console.error('removeUser error:', err);
    res.status(500).json({ message: 'Failed to remove user' });
  }
};

module.exports = {
  listUsers,
  inviteUser,
  resendInvite,
  updateUser,
  removeUser,
};
