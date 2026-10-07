const User = require('../models/tenant/User');
const Tenant = require('../models/shared/Tenant');
const EmailConfig = require('../models/tenant/EmailConfig');
const nodemailer = require('nodemailer');
const LoginHistory = require('../models/tenant/LoginHistory');
const Product = require('../models/tenant/Product');
const Sale = require('../models/tenant/Sale');
const Warehouse = require('../models/tenant/Warehouse');
const Notification = require('../models/tenant/Notification');
const Category = require('../models/tenant/Category');
const Stock = require('../models/tenant/Stock');
const Vendor = require('../models/tenant/Vendor');
const PurchaseOrder = require('../models/tenant/PurchaseOrder');
const GoodsReceipt = require('../models/tenant/GoodsReceipt');
const Bill = require('../models/tenant/Bill');
const generateDocumentNumber = require('../utils/generateDocumentNumber');
const { receiveStockLine } = require('../utils/stockMovementService');
const INVENTORY_TYPES = require('../constants/inventoryTypes');
const { ROLE_LABELS } = require('../utils/roles');
const XLSX = require('xlsx');

const sanitizeProfile = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role === 'staff' ? 'cashier' : user.role,
  roleLabel: ROLE_LABELS[user.role] || user.role,
  status: user.status,
  authProvider: user.authProvider,
  lastLoginAt: user.lastLoginAt,
  notificationPrefs: user.notificationPrefs || {
    lowStockInApp: true,
    lowStockEmail: false,
    salesInApp: true,
    salesEmail: false,
  },
  themePreference: user.themePreference || 'system',
  createdAt: user.createdAt,
});

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || String(user.tenantId) !== String(req.auth.tenantId)) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, data: sanitizeProfile(user) });
  } catch (err) {
    console.error('getProfile', err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || String(user.tenantId) !== String(req.auth.tenantId)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, themePreference } = req.body;
    if (firstName !== undefined) {
      const name = String(firstName).trim();
      if (!name) return res.status(400).json({ message: 'First name is required' });
      user.firstName = name;
    }
    if (lastName !== undefined) user.lastName = String(lastName).trim();
    if (themePreference !== undefined) {
      if (!['light', 'dark', 'system'].includes(themePreference)) {
        return res.status(400).json({ message: 'Invalid theme' });
      }
      user.themePreference = themePreference;
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated', data: sanitizeProfile(user) });
  } catch (err) {
    console.error('updateProfile', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.auth.userId);
    if (!user || String(user.tenantId) !== String(req.auth.tenantId)) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: 'This account uses Google sign-in. Set a password via forgot password first.',
      });
    }

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    await user.setPassword(newPassword);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword', err);
    res.status(err.status || 500).json({
      message: err.message || 'Failed to change password',
    });
  }
};

exports.getBusinessInfo = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.auth.tenantId);
    if (!tenant) return res.status(404).json({ message: 'Store not found' });

    res.json({
      success: true,
      data: {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
        ownerEmail: tenant.ownerEmail,
        primaryContact: tenant.primaryContact || {},
        business: tenant.business || {},
      },
    });
  } catch (err) {
    console.error('getBusinessInfo', err);
    res.status(500).json({ message: 'Failed to load business info' });
  }
};

exports.updateBusinessInfo = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.auth.tenantId);
    if (!tenant) return res.status(404).json({ message: 'Store not found' });

    const { name, primaryContact, business } = req.body;
    if (name !== undefined) {
      const n = String(name).trim();
      if (!n) return res.status(400).json({ message: 'Store name is required' });
      tenant.name = n;
    }

    if (primaryContact) {
      tenant.primaryContact = {
        ...(tenant.primaryContact?.toObject?.() || tenant.primaryContact || {}),
        ...primaryContact,
        address: {
          ...((tenant.primaryContact?.address) || {}),
          ...(primaryContact.address || {}),
        },
      };
    }

    if (business) {
      tenant.business = {
        ...(tenant.business?.toObject?.() || tenant.business || {}),
        ...business,
      };
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'Business info updated',
      data: {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
        ownerEmail: tenant.ownerEmail,
        primaryContact: tenant.primaryContact || {},
        business: tenant.business || {},
      },
    });
  } catch (err) {
    console.error('updateBusinessInfo', err);
    res.status(500).json({ message: 'Failed to update business info' });
  }
};

exports.updateNotificationPrefs = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user || String(user.tenantId) !== String(req.auth.tenantId)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const prefs = user.notificationPrefs || {};
    const fields = ['lowStockInApp', 'lowStockEmail', 'salesInApp', 'salesEmail'];
    fields.forEach((key) => {
      if (typeof req.body[key] === 'boolean') prefs[key] = req.body[key];
    });
    user.notificationPrefs = prefs;
    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences saved',
      data: sanitizeProfile(user).notificationPrefs,
    });
  } catch (err) {
    console.error('updateNotificationPrefs', err);
    res.status(500).json({ message: 'Failed to save preferences' });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const history = await LoginHistory.find({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const user = await User.findById(req.auth.userId).select('lastLoginAt createdAt');

    res.json({
      success: true,
      data: {
        lastLoginAt: user?.lastLoginAt || null,
        accountCreatedAt: user?.createdAt || null,
        history,
      },
    });
  } catch (err) {
    console.error('getLoginHistory', err);
    res.status(500).json({ message: 'Failed to load login history' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const type = String(req.query.type || 'all').toLowerCase();

    const [productsResult, salesResult, warehousesResult, usersResult] = await Promise.allSettled([
      type === 'all' || type === 'products'
        ? Product.find({ tenantId }).lean()
        : Promise.resolve(null),
      type === 'all' || type === 'sales'
        ? Sale.find({ tenantId }).sort({ createdAt: -1 }).limit(5000).lean()
        : Promise.resolve(null),
      type === 'all' || type === 'warehouses'
        ? Warehouse.find({ tenantId }).lean()
        : Promise.resolve(null),
      type === 'all' || type === 'users'
        ? User.find({ tenantId }).select('firstName lastName email role status lastLoginAt createdAt').lean()
        : Promise.resolve(null),
    ]);

    const safe = (obj) => {
      try {
        return makeJsonSafe(obj || []);
      } catch (e) {
        return [];
      }
    };

    const products = productsResult.status === 'fulfilled' ? productsResult.value : null;
    const sales = salesResult.status === 'fulfilled' ? salesResult.value : null;
    const warehouses = warehousesResult.status === 'fulfilled' ? warehousesResult.value : null;
    const users = usersResult.status === 'fulfilled' ? usersResult.value : null;

    const productsFull = safe(products);
    const salesFull = safe(sales);
    const warehousesFull = safe(warehouses);
    const usersFull = safe(users);

    console.log(`[EXPORT] tenant=${tenantId} type=${type} products=${productsFull.length} sales=${salesFull.length}`);

    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: {
        // Full raw objects for complete backup (JSON-safe)
        productsFull,
        salesFull,
        warehousesFull,
        usersFull,

        products: productsFull.map((p) => ({
          id: p._id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          unit: p.unit,
          reorderLevel: p.reorderLevel,
          supplierName: p.supplierName,
          status: p.status,
        })),
        sales: salesFull.map((s) => ({
          invoiceId: s.invoiceId,
          total: s.total,
          paymentMethod: s.paymentMethod,
          itemCount: s.items?.length || 0,
          createdAt: s.createdAt,
        })),
        warehouses: warehousesFull.map((w) => ({
          name: w.name,
          code: w.code,
          city: w.city,
          status: w.status,
          phone: w.phone,
        })),
        users: usersFull.map((u) => ({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
          status: u.status,
          lastLoginAt: u.lastLoginAt,
        })),
      },
    });
  } catch (err) {
    console.error('exportData', err);
    res.status(500).json({ message: 'Export failed' });
  }
};

exports.importProducts = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.products) ? req.body.products : null;
    if (!rows?.length) {
      return res.status(400).json({ message: 'products array is required' });
    }

    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    // Pre-fetch categories for tenant for fast case-insensitive lookup
    const existingCategories = await Category.find({ tenantId });
    const categoryMap = new Map();
    existingCategories.forEach((cat) => {
      categoryMap.set(cat.name.trim().toLowerCase(), cat);
    });

    const resolveCategoryName = (row) => {
      const candidates = [
        row.category,
        row.categoryName,
        row.Category,
        row.CategoryName,
        row['Category Name'],
        row.category_name,
      ];
      for (const value of candidates) {
        const trimmed = String(value ?? '').trim();
        if (trimmed) return trimmed;
      }
      return '';
    };

    const getOrCreateCategory = async (catInput) => {
      const trimmed = String(catInput || '').trim();
      const catName = trimmed || 'Imported';
      const key = catName.toLowerCase();

      if (categoryMap.has(key)) {
        return categoryMap.get(key);
      }

      const newCat = await Category.create({
        tenantId,
        name: catName,
        status: 'active',
      });
      categoryMap.set(key, newCat);
      return newCat;
    };

    const VALID_UNITS = ['pcs', 'kg', 'box', 'pack', 'litre', 'dozen', 'gram'];
    const normalizeUnit = (unit) => {
      const value = String(unit || 'pcs').trim().toLowerCase();
      return VALID_UNITS.includes(value) ? value : 'pcs';
    };

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const purchasedItemsBySupplier = new Map();

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      try {
        const name = String(row.name || '').trim();
        const sku = String(row.sku || '').trim().toUpperCase();
        if (!name || !sku) {
          skipped += 1;
          errors.push({ row: i + 1, message: 'name and sku required' });
          continue;
        }

        const targetCategory = await getOrCreateCategory(resolveCategoryName(row));
        const barcodeRaw = row.barcode ? String(row.barcode).trim() : '';
        const supplierName = (row.supplierName || 'Opening Import Vendor').trim();
        const productData = {
          name,
          sku,
          barcode: barcodeRaw || null,
          costPrice: Number(row.costPrice) || 0,
          sellingPrice: Number(row.sellingPrice) || 0,
          unit: normalizeUnit(row.unit),
          reorderLevel: Number(row.reorderLevel) > 0 ? Number(row.reorderLevel) : 5,
          supplierName,
          status: row.status === 'inactive' ? 'inactive' : 'active',
          categoryId: row.categoryId || targetCategory._id,
        };

        let productDoc = await Product.findOne({ tenantId, sku });
        if (productDoc) {
          await Product.findOneAndUpdate({ tenantId, sku }, productData, { runValidators: true });
          updated += 1;
          productDoc = await Product.findOne({ tenantId, sku });
        } else {
          productDoc = await Product.create({ tenantId, ...productData });
          created += 1;
        }

        const parseQty = (val) => {
          if (val === undefined || val === null || val === '') return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        const qtyCandidate = parseQty(row.initialStock) ?? parseQty(row.quantity) ?? parseQty(row.qty) ?? parseQty(row.stockCount) ?? 10;
        if (qtyCandidate > 0) {
          if (!purchasedItemsBySupplier.has(supplierName)) {
            purchasedItemsBySupplier.set(supplierName, []);
          }
          purchasedItemsBySupplier.get(supplierName).push({
            product: productDoc,
            quantity: qtyCandidate,
            costPrice: productData.costPrice,
          });
        }
      } catch (e) {
        skipped += 1;
        errors.push({ row: i + 1, message: e.message });
      }
    }

    // --- Automatic Solution 2: Generate Purchase Orders & Stock Receipts for Imported Products ---
    let generatedPOs = 0;
    if (purchasedItemsBySupplier.size > 0) {
      let location = await Warehouse.findOne({ tenantId, status: 'active' });
      if (!location) {
        location = await Warehouse.findOne({ tenantId });
      }
      if (!location) {
        location = await Warehouse.create({
          tenantId,
          name: 'Main Store Location',
          code: 'LOC-MAIN',
          locationType: 'store',
          status: 'active',
        });
      }

      for (const [supplierName, itemsList] of purchasedItemsBySupplier.entries()) {
        try {
          let vendor = await Vendor.findOne({ tenantId, name: new RegExp(`^${supplierName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
          if (!vendor) {
            const vendorCode = await generateDocumentNumber(tenantId, 'vendor_code', 'VEND');
            vendor = await Vendor.create({
              tenantId,
              name: supplierName,
              code: vendorCode,
              status: 'active',
              note: 'Auto-created during Excel product import',
            });
          }

          const poNumber = await generateDocumentNumber(tenantId, 'purchase_order', 'PO');
          const poItems = itemsList.map((item) => ({
            productId: item.product._id,
            productName: item.product.name,
            sku: item.product.sku,
            unit: item.product.unit || 'pcs',
            quantity: item.quantity,
            unitCost: item.costPrice,
            receivedQty: item.quantity,
          }));

          const subtotal = poItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

          // 1. Create Purchase Order in 'received' status
          const poDoc = await PurchaseOrder.create({
            tenantId,
            poNumber,
            vendorId: vendor._id,
            locationId: location._id,
            orderDate: new Date(),
            items: poItems,
            status: 'received',
            notes: 'Auto-generated Purchase Order from Excel Product Import',
            subtotal,
            createdBy: userId,
          });

          // 2. Create Goods Receipt (GRN) in 'posted' status
          const grnNumber = await generateDocumentNumber(tenantId, 'goods_receipt', 'GRN');
          const grnItems = [];

          for (let idx = 0; idx < poDoc.items.length; idx += 1) {
            const poItem = poDoc.items[idx];
            const stockResult = await receiveStockLine({
              tenantId,
              userId,
              productId: poItem.productId,
              warehouseId: location._id,
              quantity: poItem.quantity,
              purchasePrice: poItem.unitCost,
              reference: grnNumber,
              note: `Excel Import Opening PO (${poNumber})`,
              inventoryType: INVENTORY_TYPES.PURCHASE_RECEIVE,
            });

            grnItems.push({
              purchaseOrderItemId: poItem._id,
              productId: poItem.productId,
              productName: poItem.productName,
              sku: poItem.sku,
              unit: poItem.unit,
              quantity: poItem.quantity,
              unitCost: poItem.unitCost,
              lineTotal: poItem.quantity * poItem.unitCost,
              batchId: stockResult.batch?._id || null,
              batchNumber: stockResult.batch?.batchNumber || null,
            });
          }

          const grnDoc = await GoodsReceipt.create({
            tenantId,
            grnNumber,
            vendorId: vendor._id,
            locationId: location._id,
            purchaseOrderId: poDoc._id,
            receivedDate: new Date(),
            items: grnItems,
            status: 'posted',
            notes: `Auto-posted GRN for Excel import PO ${poNumber}`,
            subtotal,
            totalCost: subtotal,
            createdBy: userId,
          });

          // 3. Create Vendor Bill
          const billNumber = await generateDocumentNumber(tenantId, 'bill', 'BILL');
          const billDoc = await Bill.create({
            tenantId,
            billNumber,
            vendorId: vendor._id,
            purchaseOrderId: poDoc._id,
            goodsReceiptId: grnDoc._id,
            items: grnItems.map((gi) => ({
              productId: gi.productId,
              productName: gi.productName,
              sku: gi.sku,
              quantity: gi.quantity,
              unitCost: gi.unitCost,
              lineTotal: gi.lineTotal,
            })),
            subtotal,
            tax: 0,
            total: subtotal,
            amountPaid: subtotal,
            status: 'paid',
            notes: `Paid Bill for Excel Import PO ${poNumber}`,
            createdBy: userId,
          });

          grnDoc.billId = billDoc._id;
          await grnDoc.save();

          generatedPOs += 1;
        } catch (poErr) {
          console.error(`[Import Purchase Generation Error] for ${supplierName}:`, poErr.message);
        }
      }
    }

    const parts = [];
    if (created) parts.push(`${created} products created`);
    if (updated) parts.push(`${updated} products updated`);
    if (generatedPOs) parts.push(`${generatedPOs} Purchase Orders & Stock Receipts generated`);
    if (skipped) parts.push(`${skipped} skipped`);

    res.json({
      success: true,
      message: parts.length ? `Import complete: ${parts.join(', ')}` : 'Import complete',
      created,
      updated,
      generatedPOs,
      skipped,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    console.error('importProducts error:', err);
    res.status(500).json({ message: err.message || 'Import failed' });
  }
};

exports.getBackupSummary = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const [products, sales, warehouses, users, notifications] = await Promise.all([
      Product.countDocuments({ tenantId }),
      Sale.countDocuments({ tenantId }),
      Warehouse.countDocuments({ tenantId }),
      User.countDocuments({ tenantId }),
      Notification.countDocuments({ tenantId }),
    ]);

    res.json({
      success: true,
      data: {
        products,
        sales,
        warehouses,
        users,
        notifications,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('getBackupSummary', err);
    res.status(500).json({ message: 'Failed to load backup summary' });
  }
};

/* =========================
   EMAIL CONFIG
========================= */

exports.getEmailConfig = async (req, res) => {
  try {
    const cfg = await EmailConfig.findOne({ tenantId: req.auth.tenantId });
    res.json({
      success: true,
      data: {
        enabled: cfg?.enabled ?? false,
        provider: cfg?.provider || 'gmail',
        host: cfg?.host || '',
        port: cfg?.port || 587,
        secure: cfg?.secure ?? false,
        user: cfg?.user || '',
        pass: cfg?.pass || '',
        fromName: cfg?.fromName || '',
        fromEmail: cfg?.fromEmail || '',
      },
    });
  } catch (err) {
    console.error('getEmailConfig', err);
    res.status(500).json({ message: 'Failed to load email config' });
  }
};

exports.saveEmailConfig = async (req, res) => {
  try {
    const {
      enabled,
      provider,
      host,
      port,
      secure,
      user,
      pass,
      fromName,
      fromEmail,
    } = req.body;

    const update = {
      enabled: !!enabled,
      provider: String(provider || 'gmail').trim(),
      host: String(host || '').trim(),
      port: Number(port) || 587,
      secure: !!secure,
      user: String(user || '').trim(),
      fromName: String(fromName || '').trim(),
      fromEmail: String(fromEmail || '').trim(),
    };

    // Only overwrite the stored password if a new one was explicitly sent
    if (pass !== undefined && pass !== '') {
      update.pass = String(pass);
    }

    const cfg = await EmailConfig.findOneAndUpdate(
      { tenantId: req.auth.tenantId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Email configuration saved',
      data: {
        enabled: cfg.enabled,
        provider: cfg.provider || 'gmail',
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        user: cfg.user,
        hasPass: !!cfg.pass,
        fromName: cfg.fromName,
        fromEmail: cfg.fromEmail,
      },
    });
  } catch (err) {
    console.error('saveEmailConfig', err);
    res.status(500).json({ message: 'Failed to save email config' });
  }
};

exports.testEmailConfig = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Recipient email (to) is required' });

    const cfg = await EmailConfig.findOne({ tenantId: req.auth.tenantId });
    if (!cfg?.enabled || !cfg.host || !cfg.user) {
      return res.status(400).json({
        message: 'Email config is not enabled or incomplete — save a valid config first',
      });
    }

    const t = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port) || 587,
      secure: cfg.secure === true,
      auth: { user: cfg.user, pass: cfg.pass || '' },
    });

    const from = cfg.fromEmail
      ? `"${cfg.fromName || cfg.fromEmail}" <${cfg.fromEmail}>`
      : cfg.user;

    await t.sendMail({
      from,
      to,
      subject: 'Test email from StockInsight',
      html: `<p>This is a test email confirming your SMTP configuration is working correctly.</p>`,
    });

    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    console.error('testEmailConfig', err);
    res.status(500).json({ message: err.message || 'Failed to send test email' });
  }
};

const MAX_CELL_LENGTH = 32767;

const makeJsonSafe = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Buffer.isBuffer(obj)) return obj.toString('utf8');
  if (Array.isArray(obj)) return obj.map((item) => makeJsonSafe(item));
  if (typeof obj === 'object') {
    if (typeof obj.toJSON === 'function' && obj.toJSON !== Object.prototype.toJSON) {
      return makeJsonSafe(obj.toJSON());
    }
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, makeJsonSafe(value)]));
  }
  return obj;
};

const sanitizeExportValue = (value) => {
  if (value === undefined) return '';
  if (value === null) return '';

  if (typeof value === 'string') {
    if (value.length > MAX_CELL_LENGTH) {
      return `${value.slice(0, MAX_CELL_LENGTH - 20)}…[truncated]`;
    }
    return value;
  }

  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('utf8');

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeExportValue(item));
  }

  if (typeof value === 'object') {
    if (typeof value.toJSON === 'function' && value.toJSON !== Object.prototype.toJSON) {
      return sanitizeExportValue(makeJsonSafe(value.toJSON()));
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, itemValue]) => [key, sanitizeExportValue(itemValue)])
    );
  }

  return value;
};

const normalizeExportRow = (row) => {
  if (!row || typeof row !== 'object') return row;

  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key] = sanitizeExportValue(value);
  });

  return normalized;
};

const appendSheet = (workbook, name, data) => {
  if (!Array.isArray(data)) return;
  const rows = data.map((row) => normalizeExportRow(makeJsonSafe(row)));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
};

exports.exportDataFile = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const type = String(req.query.type || 'all').toLowerCase();

    const wantProducts = type === 'all' || type === 'products';
    const wantSales = type === 'all' || type === 'sales';
    const wantFull = type === 'all';

    const [products, sales, warehouses, users, categories, stocks] = await Promise.all([
      wantProducts ? Product.find({ tenantId }).lean() : Promise.resolve([]),
      wantSales
        ? Sale.find({ tenantId }).sort({ createdAt: -1 }).limit(10000).lean()
        : Promise.resolve([]),
      wantFull ? Warehouse.find({ tenantId }).lean() : Promise.resolve([]),
      wantFull
        ? User.find({ tenantId })
            .select('firstName lastName email role status lastLoginAt createdAt')
            .lean()
        : Promise.resolve([]),
      wantFull || wantProducts ? Category.find({ tenantId }).lean() : Promise.resolve([]),
      wantFull || wantProducts ? Stock.find({ tenantId }).lean() : Promise.resolve([]),
    ]);

    const categoryIdMap = new Map();
    (categories || []).forEach((c) => {
      categoryIdMap.set(String(c._id), c.name);
    });

    const workbook = XLSX.utils.book_new();
    let sheetCount = 0;

    const addSheet = (name, rows) => {
      const safeRows = Array.isArray(rows) && rows.length
        ? rows.map((row) => normalizeExportRow(makeJsonSafe(row)))
        : [{ info: 'No data' }];
      const worksheet = XLSX.utils.json_to_sheet(safeRows);
      // Excel sheet names max 31 chars
      const sheetName = String(name).slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      sheetCount += 1;
    };

    if (wantProducts) {
      addSheet(
        'Products',
        products.map((p) => ({
          id: String(p._id),
          name: p.name,
          sku: p.sku,
          category: categoryIdMap.get(String(p.categoryId)) || '',
          barcode: p.barcode || '',
          categoryId: p.categoryId ? String(p.categoryId) : '',
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          unit: p.unit,
          reorderLevel: p.reorderLevel,
          supplierName: p.supplierName || '',
          status: p.status,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
      );

      if (wantFull || wantProducts) {
        addSheet(
          'Stock',
          stocks.map((s) => ({
            productId: s.productId ? String(s.productId) : '',
            warehouseId: s.warehouseId ? String(s.warehouseId) : '',
            quantity: s.quantity,
            updatedAt: s.updatedAt,
          }))
        );
      }
    }

    if (wantSales) {
      addSheet(
        'Sales',
        sales.map((s) => ({
          invoiceId: s.invoiceId,
          subtotal: s.subtotal,
          tax: s.tax,
          total: s.total,
          paymentMethod: s.paymentMethod,
          cashReceived: s.cashReceived,
          changeReturned: s.changeReturned,
          returnStatus: s.returnStatus || '',
          itemCount: Array.isArray(s.items) ? s.items.length : 0,
          createdAt: s.createdAt,
        }))
      );

      const saleItems = [];
      sales.forEach((s) => {
        (s.items || []).forEach((item, idx) => {
          saleItems.push({
            invoiceId: s.invoiceId,
            line: idx + 1,
            productId: item.productId ? String(item.productId) : '',
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            returnedQty: item.returnedQty || 0,
            saleDate: s.createdAt,
          });
        });
      });
      addSheet('SaleItems', saleItems);
    }

    if (wantFull) {
      addSheet(
        'Warehouses',
        warehouses.map((w) => ({
          id: String(w._id),
          name: w.name,
          code: w.code,
          city: w.city || '',
          address: w.address || '',
          contactPerson: w.contactPerson || '',
          phone: w.phone || '',
          email: w.email || '',
          status: w.status,
        }))
      );
      addSheet(
        'Categories',
        categories.map((c) => ({
          id: String(c._id),
          name: c.name,
          status: c.status,
        }))
      );
      addSheet(
        'Users',
        users.map((u) => ({
          firstName: u.firstName,
          lastName: u.lastName || '',
          email: u.email,
          role: u.role,
          status: u.status,
          lastLoginAt: u.lastLoginAt || '',
          createdAt: u.createdAt,
        }))
      );
      addSheet('Summary', [
        {
          exportedAt: new Date().toISOString(),
          products: products.length,
          sales: sales.length,
          warehouses: warehouses.length,
          categories: categories.length,
          users: users.length,
          stockRows: stocks.length,
        },
      ]);
    }

    if (!sheetCount) {
      return res.status(400).json({ message: 'Invalid export type. Use all, products, or sales.' });
    }

    const filename = `backup-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (err) {
    console.error('exportDataFile', err);
    res.status(500).json({ message: 'Export file generation failed' });
  }
};
