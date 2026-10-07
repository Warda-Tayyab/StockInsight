/** @module shared/services/settingsService */

import api from '../utils/api';

const settingsService = {
  getProfile: () => api.get('/api/settings/profile'),
  updateProfile: (payload) => api.patch('/api/settings/profile', payload),
  changePassword: (payload) => api.post('/api/settings/profile/password', payload),

  getBusiness: () => api.get('/api/settings/business'),
  updateBusiness: (payload) => api.patch('/api/settings/business', payload),

  updateNotifications: (payload) => api.patch('/api/settings/notifications', payload),

  getLoginHistory: () => api.get('/api/settings/security/login-history'),

  exportData: (type = 'all') => api.get(`/api/settings/data/export?type=${type}`),
  exportDataFile: (type = 'all') => api.get(`/api/settings/data/export-file?type=${type}`, { responseType: 'blob' }),
  importProducts: (products) => api.post('/api/settings/data/import-products', { products }),
  getBackupSummary: () => api.get('/api/settings/data/backup-summary'),

  // Enterprise Backup & Restore
  createManualBackup: () => api.post('/api/settings/data/backups/create'),
  getBackupsList: () => api.get('/api/settings/data/backups'),
  downloadBackupFile: (filename) =>
    api.get(`/api/settings/data/backups/${encodeURIComponent(filename)}/download`, { responseType: 'blob' }),
  deleteBackupFile: (filename) =>
    api.delete(`/api/settings/data/backups/${encodeURIComponent(filename)}`),
  restoreBackup: (payload, isFormData = false) => {
    if (isFormData) {
      return api.post('/api/settings/data/backups/restore', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/api/settings/data/backups/restore', payload);
  },
  getScheduleConfig: () => api.get('/api/settings/data/backups/schedule'),
  updateScheduleConfig: (payload) => api.put('/api/settings/data/backups/schedule', payload),

  getEmailConfig: () => api.get('/api/settings/email-config'),
  saveEmailConfig: (payload) => api.put('/api/settings/email-config', payload),
  testEmailConfig: (payload) => api.post('/api/settings/email-config/test', payload),
};

export default settingsService;
