const cron = require('node-cron');
const Tenant = require('../models/shared/Tenant');
const BackupConfig = require('../models/tenant/BackupConfig');
const { createTenantBackup, cleanExpiredBackups } = require('./backupService');

let scheduledTask = null;

const runScheduledBackups = async () => {
  console.log('[Backup Scheduler] Running scheduled backup check...');
  try {
    const activeTenants = await Tenant.find({ status: 'active' }).select('_id name');
    console.log(`[Backup Scheduler] Found ${activeTenants.length} active tenant(s)`);

    for (const tenant of activeTenants) {
      const tenantId = String(tenant._id);
      try {
        let config = await BackupConfig.findOne({ tenantId: tenant._id });
        if (!config) {
          config = await BackupConfig.create({ tenantId: tenant._id });
        }

        if (config.autoBackupEnabled === false) {
          console.log(`[Backup Scheduler] Skipping tenant "${tenant.name}" (${tenantId}): Auto-backup disabled`);
          continue;
        }

        const now = Date.now();
        const lastBackupTime = config.lastBackupAt ? new Date(config.lastBackupAt).getTime() : 0;
        const hoursSinceLast = (now - lastBackupTime) / (1000 * 60 * 60);

        const isDailyDue = config.frequency === 'daily' && hoursSinceLast >= 20;
        const isWeeklyDue = config.frequency === 'weekly' && hoursSinceLast >= 140;
        const isFirstTime = !config.lastBackupAt;

        if (isDailyDue || isWeeklyDue || isFirstTime) {
          console.log(`[Backup Scheduler] Creating scheduled backup for tenant "${tenant.name}" (${tenantId})`);
          await createTenantBackup(tenant._id, { type: 'scheduled', createdBy: 'cron-scheduler' });
          await cleanExpiredBackups(tenant._id, config.retentionDays || 14);
        } else {
          console.log(`[Backup Scheduler] Tenant "${tenant.name}" backup is not due yet (last done ${hoursSinceLast.toFixed(1)}h ago)`);
        }
      } catch (tenantErr) {
        console.error(`[Backup Scheduler] Failed backup for tenant "${tenant.name}" (${tenantId}):`, tenantErr.message);
      }
    }
  } catch (err) {
    console.error('[Backup Scheduler] Error running scheduled backup job:', err.message);
  }
};

/**
 * Initializes the background backup scheduler
 */
const initBackupScheduler = () => {
  if (scheduledTask) {
    console.log('[Backup Scheduler] Scheduler is already initialized');
    return;
  }

  // Schedule to run every day at 02:00 AM ('0 2 * * *')
  // For production reliability, we also run an initial check shortly after startup
  scheduledTask = cron.schedule('0 2 * * *', () => {
    runScheduledBackups();
  });

  console.log('[Backup Scheduler] Cron job initialized (runs daily at 02:00 AM)');

  // Run first check 30 seconds after server startup
  setTimeout(() => {
    runScheduledBackups();
  }, 30000);
};

module.exports = {
  initBackupScheduler,
  runScheduledBackups,
};
