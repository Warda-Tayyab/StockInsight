const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const {
  listUsers,
  inviteUser,
  resendInvite,
  updateUser,
  removeUser,
} = require('../controllers/userManagementController');

const managementAuth = [
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true }),
];

router.get('/', ...managementAuth, listUsers);
router.post('/invite', ...managementAuth, inviteUser);
router.post('/:id/resend-invite', ...managementAuth, resendInvite);
router.patch('/:id', ...managementAuth, updateUser);
router.delete('/:id', ...managementAuth, removeUser);

module.exports = router;
