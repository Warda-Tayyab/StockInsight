const fs = require('fs');
const backupService = require('../service/backupService');
const BackupConfig = require('../models/tenant/BackupConfig');

/**
 * 1️⃣ Create Manual Backup
 */
exports.createManualBackup = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const backup = await backupService.createTenantBackup(tenantId, {
      type: 'manual',
      createdBy: req.auth.userId || 'store-owner',
    });

    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: backup,
    });
  } catch (err) {
    console.error('createManualBackup error:', err);
    res.status(500).json({ message: err.message || 'Failed to create backup' });
  }
};

/**
 * 2️⃣ List Backups
 */
exports.getBackupsList = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const backups = await backupService.listTenantBackups(tenantId);
    res.json({
      success: true,
      data: backups,
    });
  } catch (err) {
    console.error('getBackupsList error:', err);
    res.status(500).json({ message: 'Failed to retrieve backups list' });
  }
};

/**
 * 3️⃣ Download Backup File
 */
exports.downloadBackupFile = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { filename } = req.params;

    const filePath = backupService.getBackupFilePath(tenantId, filename);
    res.download(filePath, filename);
  } catch (err) {
    console.error('downloadBackupFile error:', err);
    res.status(404).json({ message: err.message || 'Backup file not found' });
  }
};

/**
 * 4️⃣ Delete Backup File
 */
exports.deleteBackupFile = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { filename } = req.params;

    backupService.deleteBackup(tenantId, filename);
    res.json({
      success: true,
      message: `Backup ${filename} deleted successfully`,
    });
  } catch (err) {
    console.error('deleteBackupFile error:', err);
    res.status(400).json({ message: err.message || 'Failed to delete backup file' });
  }
};

/**
 * 5️⃣ Restore Backup Data
 */
exports.restoreBackup = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    let backupData = null;

    // Case A: Restoring from a server backup filename
    if (req.body?.filename) {
      const filePath = backupService.getBackupFilePath(tenantId, req.body.filename);
      const content = fs.readFileSync(filePath, 'utf8');
      backupData = JSON.parse(content);
    }
    // Case B: Restoring from an uploaded file
    else if (req.file) {
      const content = req.file.buffer
        ? req.file.buffer.toString('utf8')
        : fs.readFileSync(req.file.path, 'utf8');
      backupData = JSON.parse(content);
    }
    // Case C: Direct JSON body
    else if (req.body?.backupData) {
      backupData = typeof req.body.backupData === 'string'
        ? JSON.parse(req.body.backupData)
        : req.body.backupData;
    }

    if (!backupData) {
      return res.status(400).json({
        message: 'No backup provided. Specify a filename, upload a backup file, or send backupData JSON.',
      });
    }

    const result = await backupService.restoreTenantBackup(tenantId, backupData);

    res.json({
      success: true,
      message: 'Store data restored successfully from backup snapshot',
      data: result,
    });
  } catch (err) {
    console.error('restoreBackup error:', err);
    res.status(500).json({ message: err.message || 'Data restoration failed' });
  }
};

/**
 * 6️⃣ Get Schedule Settings
 */
exports.getScheduleConfig = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    let config = await BackupConfig.findOne({ tenantId });
    if (!config) {
      config = await BackupConfig.create({ tenantId });
    }

    res.json({
      success: true,
      data: {
        autoBackupEnabled: config.autoBackupEnabled,
        frequency: config.frequency,
        retentionDays: config.retentionDays,
        lastBackupAt: config.lastBackupAt,
        lastBackupStatus: config.lastBackupStatus,
        lastBackupMessage: config.lastBackupMessage,
      },
    });
  } catch (err) {
    console.error('getScheduleConfig error:', err);
    res.status(500).json({ message: 'Failed to fetch backup schedule settings' });
  }
};

/**
 * 7️⃣ Update Schedule Settings
 */
exports.updateScheduleConfig = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { autoBackupEnabled, frequency, retentionDays } = req.body;

    const updateFields = {};
    if (typeof autoBackupEnabled === 'boolean') {
      updateFields.autoBackupEnabled = autoBackupEnabled;
    }
    if (frequency && ['daily', 'weekly'].includes(frequency)) {
      updateFields.frequency = frequency;
    }
    if (Number(retentionDays) >= 1 && Number(retentionDays) <= 365) {
      updateFields.retentionDays = Number(retentionDays);
    }

    const config = await BackupConfig.findOneAndUpdate(
      { tenantId },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Backup schedule settings updated successfully',
      data: {
        autoBackupEnabled: config.autoBackupEnabled,
        frequency: config.frequency,
        retentionDays: config.retentionDays,
        lastBackupAt: config.lastBackupAt,
        lastBackupStatus: config.lastBackupStatus,
        lastBackupMessage: config.lastBackupMessage,
      },
    });
  } catch (err) {
    console.error('updateScheduleConfig error:', err);
    res.status(500).json({ message: 'Failed to save backup schedule settings' });
  }
};
