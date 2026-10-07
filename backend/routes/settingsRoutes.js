const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  getBusinessInfo,
  updateBusinessInfo,
  updateNotificationPrefs,
  getLoginHistory,
  exportData,
  exportDataFile,
  importProducts,
  getBackupSummary,
  getEmailConfig,
  saveEmailConfig,
  testEmailConfig,
} = require('../controllers/settingsController');

const {
  createManualBackup,
  getBackupsList,
  downloadBackupFile,
  deleteBackupFile,
  restoreBackup,
  getScheduleConfig,
  updateScheduleConfig,
} = require('../controllers/backupController');

const ownerAuth = [
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true }),
];

// Profile / account (owner settings hub — still owner-only route mount)
router.get('/profile', ...ownerAuth, getProfile);
router.patch('/profile', ...ownerAuth, updateProfile);
router.post('/profile/password', ...ownerAuth, changePassword);

router.get('/business', ...ownerAuth, getBusinessInfo);
router.patch('/business', ...ownerAuth, updateBusinessInfo);

router.patch('/notifications', ...ownerAuth, updateNotificationPrefs);

router.get('/security/login-history', ...ownerAuth, getLoginHistory);

router.get('/data/export', ...ownerAuth, exportData);
router.get('/data/export-file', ...ownerAuth, exportDataFile);
router.post('/data/import-products', ...ownerAuth, importProducts);
router.get('/data/backup-summary', ...ownerAuth, getBackupSummary);

/* ==========================================
   ENTERPRISE BACKUP & RESTORE ROUTES
   ========================================== */
router.post('/data/backups/create', ...ownerAuth, createManualBackup);
router.get('/data/backups', ...ownerAuth, getBackupsList);
router.get('/data/backups/:filename/download', ...ownerAuth, downloadBackupFile);
router.delete('/data/backups/:filename', ...ownerAuth, deleteBackupFile);
router.post('/data/backups/restore', ...ownerAuth, upload.single('file'), restoreBackup);
router.get('/data/backups/schedule', ...ownerAuth, getScheduleConfig);
router.put('/data/backups/schedule', ...ownerAuth, updateScheduleConfig);

router.get('/email-config', ...ownerAuth, getEmailConfig);
router.put('/email-config', ...ownerAuth, saveEmailConfig);
router.post('/email-config/test', ...ownerAuth, testEmailConfig);

module.exports = router;
