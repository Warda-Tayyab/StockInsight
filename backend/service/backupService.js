const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Tenant Models
const Product = require('../models/tenant/Product');
const Category = require('../models/tenant/Category');
const Stock = require('../models/tenant/Stock');
const Warehouse = require('../models/tenant/Warehouse');
const Sale = require('../models/tenant/Sale');
const PurchaseOrder = require('../models/tenant/PurchaseOrder');
const PurchaseReturn = require('../models/tenant/PurchaseReturn');
const GoodsReceipt = require('../models/tenant/GoodsReceipt');
const Bill = require('../models/tenant/Bill');
const Vendor = require('../models/tenant/Vendor');
const Batch = require('../models/tenant/Batch');
const ReturnExchange = require('../models/tenant/ReturnExchange');
const ReturnExchangePolicy = require('../models/tenant/ReturnExchangePolicy');
const StockTransfer = require('../models/tenant/StockTransfer');
const WriteOff = require('../models/tenant/WriteOff');
const StoreDiscount = require('../models/tenant/StoreDiscount');
const Coupon = require('../models/tenant/Coupon');
const EmailConfig = require('../models/tenant/EmailConfig');
const Notification = require('../models/tenant/Notification');
const Counter = require('../models/tenant/Counter');
const User = require('../models/tenant/User');
const BackupConfig = require('../models/tenant/BackupConfig');

const BACKUP_DIR = path.join(__dirname, '../backups');

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
};

/**
 * List of collections backed up per tenant
 */
const TENANT_MODELS = [
  { key: 'products', model: Product },
  { key: 'categories', model: Category },
  { key: 'stocks', model: Stock },
  { key: 'warehouses', model: Warehouse },
  { key: 'sales', model: Sale },
  { key: 'purchaseOrders', model: PurchaseOrder },
  { key: 'purchaseReturns', model: PurchaseReturn },
  { key: 'goodsReceipts', model: GoodsReceipt },
  { key: 'bills', model: Bill },
  { key: 'vendors', model: Vendor },
  { key: 'batches', model: Batch },
  { key: 'returnExchanges', model: ReturnExchange },
  { key: 'returnExchangePolicies', model: ReturnExchangePolicy },
  { key: 'stockTransfers', model: StockTransfer },
  { key: 'writeOffs', model: WriteOff },
  { key: 'storeDiscounts', model: StoreDiscount },
  { key: 'coupons', model: Coupon },
  { key: 'emailConfigs', model: EmailConfig },
  { key: 'notifications', model: Notification },
  { key: 'counters', model: Counter },
  { key: 'users', model: User },
];

/**
 * Creates a JSON snapshot backup for a tenant
 */
const createTenantBackup = async (tenantId, options = {}) => {
  try {
    ensureBackupDir();

    const tId = String(tenantId);
    const backupType = options.type || 'manual';
    const createdBy = options.createdBy || 'system';

    const backupData = {
      version: '1.0',
      system: 'StockInsight Inventory System',
      tenantId: tId,
      createdAt: new Date().toISOString(),
      backupType,
      createdBy,
      counts: {},
      data: {},
    };

    let totalRecords = 0;

    for (const { key, model } of TENANT_MODELS) {
      try {
        const records = await model.find({ tenantId: tId }).lean();
        backupData.data[key] = records;
        backupData.counts[key] = records.length;
        totalRecords += records.length;
      } catch (err) {
        console.warn(`[Backup] Error fetching ${key} for tenant ${tId}:`, err.message);
        backupData.data[key] = [];
        backupData.counts[key] = 0;
      }
    }

    backupData.totalRecords = totalRecords;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${tId}_${timestamp}_${backupType}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

    const stats = fs.statSync(filePath);

    // Update BackupConfig status
    await BackupConfig.findOneAndUpdate(
      { tenantId: tId },
      {
        $set: {
          lastBackupAt: new Date(),
          lastBackupStatus: 'success',
          lastBackupMessage: `Backup created (${totalRecords} records, ${(stats.size / 1024).toFixed(1)} KB)`,
        },
      },
      { upsert: true }
    );

    return {
      filename,
      filePath,
      sizeBytes: stats.size,
      totalRecords,
      counts: backupData.counts,
      createdAt: backupData.createdAt,
      backupType,
    };
  } catch (err) {
    console.error('[Backup] Failed to create tenant backup:', err);
    await BackupConfig.findOneAndUpdate(
      { tenantId },
      {
        $set: {
          lastBackupStatus: 'failed',
          lastBackupMessage: err.message,
        },
      },
      { upsert: true }
    );
    throw err;
  }
};

/**
 * Lists all stored backups for a tenant
 */
const listTenantBackups = async (tenantId) => {
  ensureBackupDir();
  const tId = String(tenantId);
  const files = fs.readdirSync(BACKUP_DIR);

  const tenantBackups = [];

  for (const filename of files) {
    if (!filename.startsWith(`backup_${tId}_`) || !filename.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(BACKUP_DIR, filename);
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);

      tenantBackups.push({
        filename,
        sizeBytes: stats.size,
        createdAt: json.createdAt || stats.birthtime.toISOString(),
        backupType: json.backupType || 'unknown',
        totalRecords: json.totalRecords || 0,
        counts: json.counts || {},
        createdBy: json.createdBy || 'unknown',
      });
    } catch (err) {
      console.warn(`[Backup] Error reading file ${filename}:`, err.message);
    }
  }

  // Sort descending by createdAt
  tenantBackups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return tenantBackups;
};

/**
 * Gets path to a backup file safely
 */
const getBackupFilePath = (tenantId, filename) => {
  ensureBackupDir();
  const tId = String(tenantId);
  const safeFilename = path.basename(filename);

  if (!safeFilename.startsWith(`backup_${tId}_`) || !safeFilename.endsWith('.json')) {
    throw new Error('Access denied: Invalid backup filename for this tenant');
  }

  const filePath = path.join(BACKUP_DIR, safeFilename);
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }

  return filePath;
};

/**
 * Deletes a backup file for a tenant
 */
const deleteBackup = (tenantId, filename) => {
  const filePath = getBackupFilePath(tenantId, filename);
  fs.unlinkSync(filePath);
  return true;
};

/**
 * Cleans backups older than retentionDays
 */
const cleanExpiredBackups = async (tenantId, retentionDays = 14) => {
  try {
    const backups = await listTenantBackups(tenantId);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    for (const b of backups) {
      const ageMs = now - new Date(b.createdAt).getTime();
      if (ageMs > maxAgeMs) {
        try {
          deleteBackup(tenantId, b.filename);
          deletedCount += 1;
        } catch (e) {
          console.warn(`[Backup Retention] Could not delete ${b.filename}:`, e.message);
        }
      }
    }
    if (deletedCount > 0) {
      console.log(`[Backup Retention] Deleted ${deletedCount} expired backup(s) for tenant ${tenantId}`);
    }
    return deletedCount;
  } catch (err) {
    console.error('[Backup Retention] Error during cleanup:', err);
    return 0;
  }
};

/**
 * Restores tenant data from a backup snapshot object
 */
const restoreTenantBackup = async (tenantId, backupData) => {
  if (!backupData || typeof backupData !== 'object' || !backupData.data) {
    throw new Error('Invalid backup format: missing root "data" object');
  }

  const tId = new mongoose.Types.ObjectId(String(tenantId));
  const restoredCounts = {};

  // First, create a safety snapshot before overwriting
  try {
    await createTenantBackup(tenantId, {
      type: 'pre-restore-safety',
      createdBy: 'system-auto',
    });
  } catch (safetyErr) {
    console.warn('[Restore] Pre-restore safety backup failed, continuing restore:', safetyErr.message);
  }

  // Restore each collection
  for (const { key, model } of TENANT_MODELS) {
    const items = backupData.data[key];
    if (!Array.isArray(items)) continue;

    // Delete existing tenant data for this model
    await model.deleteMany({ tenantId: tId });

    if (items.length === 0) {
      restoredCounts[key] = 0;
      continue;
    }

    // Ensure tenantId is set to target tenantId on all documents
    const preparedItems = items.map((item) => {
      const doc = { ...item, tenantId: tId };
      // Convert string IDs back to ObjectIds if present
      if (doc._id && typeof doc._id === 'string') {
        try {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        } catch (e) {
          // Keep original if not ObjectId format
        }
      }
      return doc;
    });

    // Insert items
    await model.insertMany(preparedItems, { ordered: false });
    restoredCounts[key] = preparedItems.length;
  }

  return {
    success: true,
    restoredAt: new Date().toISOString(),
    restoredCounts,
  };
};

module.exports = {
  createTenantBackup,
  listTenantBackups,
  getBackupFilePath,
  deleteBackup,
  cleanExpiredBackups,
  restoreTenantBackup,
};
