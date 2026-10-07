const StoreDiscount = require('../models/tenant/StoreDiscount');
const Coupon = require('../models/tenant/Coupon');
const Product = require('../models/tenant/Product');
const Category = require('../models/tenant/Category');
const Batch = require('../models/tenant/Batch');
const {
  calculateDiscountAmount,
  validateDiscountAgainstCostPrice,
  getScopedDiscountBase,
  getEligibleStoreDiscounts,
  validateCoupon,
  applyPromotions,
  formatScopeLabel
} = require('../utils/promotionHelpers');
const { enrichCartItemsWithBatchBreakdown } = require('../utils/batchAllocationHelper');

const formatDiscountLabel = (item) => {
  if (!item) return '';
  const scopePrefix = item.scope && item.scope !== 'all' ? `${formatScopeLabel(item)}: ` : '';
  if (item.type === 'percentage') return `${scopePrefix}${item.name || item.code} (${item.value}%)`;
  return `${scopePrefix}${item.name || item.code} ($${Number(item.value).toFixed(2)})`;
};

const normalizeCartItems = (items = []) =>
  items.map((item) => ({
    productId: item.productId,
    categoryId: item.categoryId,
    supplierName: item.supplierName,
    costPrice: Number(item.costPrice) || 0,
    lineTotal: Number(item.lineTotal) || 0,
    quantity: Number(item.quantity) || 0
  }));
const validateSelectedBatchIds = async (tenantId, batchIds = []) => {
  if (!batchIds.length) {
    return { valid: false, message: 'Select at least one batch.' };
  }

  const batches = await Batch.find({
    _id: { $in: batchIds },
    tenantId,
    remainingQty: { $gt: 0 }
  })
    .select('_id')
    .lean();

  if (batches.length !== batchIds.length) {
    return {
      valid: false,
      message: 'One or more selected batches are no longer available. Please refresh the batch list.'
    };
  }

  return { valid: true, batches };
};

const parsePromotionScopeFields = (body) => {
  const scope = body.scope || 'all';

  if (!['product', 'batch'].includes(scope)) {
    return { error: 'Invalid promotion scope.' };
  }

 
  const productIds = Array.isArray(body.productIds) ? body.productIds.filter(Boolean) : [];
 
  const batchIds = Array.isArray(body.batchIds) ? body.batchIds.filter(Boolean) : [];

 
  if (scope === 'product' && !productIds.length) {
    return { error: 'Select at least one product.' };
  }

  if (scope === 'batch' && !batchIds.length) {
    return { error: 'Select at least one batch.' };
  }


  return {
    scope,
    productIds: scope === 'product' ? productIds : [],
    batchIds: scope === 'batch' ? batchIds : []
    
  };
};

const prepareCartItemsForPromotions = async (tenantId, items = []) => {
  const normalized = normalizeCartItems(items);

  const productIds = normalized
    .map((item) => item.productId)
    .filter(Boolean);

  const products = await Product.find({
    _id: { $in: productIds },
    tenantId
  })
    .select('_id costPrice')
    .lean();

  const costPriceMap = new Map(
    products.map((product) => [
      String(product._id),
      Number(product.costPrice) || 0
    ])
  );

  const itemsWithCostPrice = normalized.map((item) => ({
    ...item,
    costPrice: costPriceMap.get(String(item.productId)) ?? 0
  }));

  return enrichCartItemsWithBatchBreakdown(
    tenantId,
    itemsWithCostPrice
  );
};
exports.getDiscounts = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const discounts = await StoreDiscount.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, discounts });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load discounts.' });
  }
};

exports.createDiscount = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { name, type, value,  startDate, endDate, isActive } = req.body;
    const scopeFields = parsePromotionScopeFields(req.body);

    if (scopeFields.error) {
      return res.status(400).json({ message: scopeFields.error });
    }

    if (scopeFields.scope === 'batch') {
      const batchValidation = await validateSelectedBatchIds(tenantId, scopeFields.batchIds);
      if (!batchValidation.valid) {
        return res.status(400).json({ message: batchValidation.message });
      }
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Discount name is required.' });
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ message: 'Invalid discount type.' });
    }

    if (value == null || Number(value) <= 0) {
      return res.status(400).json({ message: 'Discount value must be greater than zero.' });
    }

    if (type === 'percentage' && Number(value) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%.' });
    }
    const costPriceValidation =
    await validateDiscountAgainstCostPrice({
      tenantId,
      type,
      value,
      scope: scopeFields.scope,
      productIds: scopeFields.productIds,
      batchIds: scopeFields.batchIds
    });
  
  if (!costPriceValidation.valid) {
    return res.status(400).json({
      message: costPriceValidation.message
    });
  }
  
    const discount = await StoreDiscount.create({
      tenantId,
      name: name.trim(),
      type,
      value: Number(value),
      ...scopeFields,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: Boolean(isActive)
    });

    res.status(201).json({ success: true, discount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create discount.' });
  }
};
exports.updateDiscount = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };

    if (
      updates.scope ||
      updates.categoryIds ||
      updates.productIds ||
      updates.brandNames ||
      updates.batchIds ||
      updates.expiryWithinDays !== undefined
    ) {
      const scopeFields = parsePromotionScopeFields({
        scope: updates.scope,
        categoryIds: updates.categoryIds,
        productIds: updates.productIds,
        brandNames: updates.brandNames,
        batchIds: updates.batchIds,
        expiryWithinDays: updates.expiryWithinDays
      });

      if (scopeFields.error) {
        return res.status(400).json({ message: scopeFields.error });
      }

      if (scopeFields.scope === 'batch') {
        const batchValidation = await validateSelectedBatchIds(tenantId, scopeFields.batchIds);
        if (!batchValidation.valid) {
          return res.status(400).json({ message: batchValidation.message });
        }
      }

      Object.assign(updates, scopeFields);
    }

    if (updates.name != null) updates.name = String(updates.name).trim();
    if (updates.value != null) updates.value = Number(updates.value);
    if (updates.startDate !== undefined) {
      updates.startDate = updates.startDate ? new Date(updates.startDate) : null;
    }
    if (updates.endDate !== undefined) {
      updates.endDate = updates.endDate ? new Date(updates.endDate) : null;
    }

    if (updates.type && !['percentage', 'fixed'].includes(updates.type)) {
      return res.status(400).json({ message: 'Invalid discount type.' });
    }

    const existingDiscount = await StoreDiscount.findOne({
      _id: id,
      tenantId
    }).lean();
    
    if (!existingDiscount) {
      return res.status(404).json({
        message: 'Discount not found.'
      });
    }
    
    const validationType =
      updates.type ?? existingDiscount.type;
    
    const validationValue =
      updates.value ?? existingDiscount.value;
    
    const validationScope =
      updates.scope ?? existingDiscount.scope;
    
    const validationProductIds =
      updates.productIds ?? existingDiscount.productIds ?? [];
    
    const validationCategoryIds =
      updates.categoryIds ?? existingDiscount.categoryIds ?? [];
    
    const validationBrandNames =
      updates.brandNames ?? existingDiscount.brandNames ?? [];
    
    const validationBatchIds =
      updates.batchIds ?? existingDiscount.batchIds ?? [];
    
    if (
      validationType === 'percentage' &&
      Number(validationValue) > 100
    ) {
      return res.status(400).json({
        message: 'Percentage discount cannot exceed 100%.'
      });
    }
    
    const costPriceValidation =
      await validateDiscountAgainstCostPrice({
        tenantId,
        type: validationType,
        value: validationValue,
        scope: validationScope,
        productIds: validationProductIds,
        categoryIds: validationCategoryIds,
        brandNames: validationBrandNames,
        batchIds: validationBatchIds
      });
    
    if (!costPriceValidation.valid) {
      return res.status(400).json({
        message: costPriceValidation.message
      });
    }

    const discount = await StoreDiscount.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updates },
      { new: true }
    );

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found.' });
    }

    res.json({ success: true, discount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update discount.' });
  }
};
exports.deleteDiscount = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { id } = req.params;

    const discount = await StoreDiscount.findOneAndDelete({ _id: id, tenantId });
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found.' });
    }

    res.json({ success: true, message: 'Discount deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete discount.' });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const coupons = await Coupon.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load coupons.' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxUses,
      startDate,
      endDate,
      isActive
    } = req.body;

    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ message: 'Invalid coupon type.' });
    }

    if (value == null || Number(value) <= 0) {
      return res.status(400).json({ message: 'Coupon value must be greater than zero.' });
    }

    if (type === 'percentage' && Number(value) > 100) {
      return res.status(400).json({ message: 'Percentage coupon cannot exceed 100%.' });
    }

   

    const existing = await Coupon.findOne({ tenantId, code: normalizedCode });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists.' });
    }

    const coupon = await Coupon.create({
      tenantId,
      code: normalizedCode,
      description: description?.trim() || '',
      type,
      value: Number(value),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxUses: maxUses != null && maxUses !== '' ? Number(maxUses) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive !== false
    });

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create coupon.' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };

    if (updates.code != null) {
      updates.code = String(updates.code).trim().toUpperCase();
      const duplicate = await Coupon.findOne({
        tenantId,
        code: updates.code,
        _id: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({ message: 'Coupon code already exists.' });
      }
    }

    if (updates.description != null) updates.description = String(updates.description).trim();
    if (updates.value != null) updates.value = Number(updates.value);
    if (updates.minOrderAmount != null) updates.minOrderAmount = Number(updates.minOrderAmount);
    if (updates.maxUses !== undefined) {
      updates.maxUses = updates.maxUses != null && updates.maxUses !== '' ? Number(updates.maxUses) : null;
    }
    if (updates.startDate !== undefined) {
      updates.startDate = updates.startDate ? new Date(updates.startDate) : null;
    }
    if (updates.endDate !== undefined) {
      updates.endDate = updates.endDate ? new Date(updates.endDate) : null;
    }

 

    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updates },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update coupon.' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { id } = req.params;

    const coupon = await Coupon.findOneAndDelete({ _id: id, tenantId });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete coupon.' });
  }
};

exports.getDiscountOptions = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const [categories, products, batches] = await Promise.all([
      Category.find({ tenantId })
        .select('name')
        .sort({ name: 1 })
        .lean(),

      Product.find({
        tenantId,
        status: 'active'
      })
        .select('name supplierName categoryId')
        .populate('categoryId', 'name')
        .sort({ name: 1 })
        .lean(),

      Batch.find({
        tenantId,
        remainingQty: { $gt: 0 }
      })
        .populate('productId', 'name sku')
        .populate('warehouseId', 'name')
        .select(
          '_id batchNumber productId warehouseId remainingQty quantity receivedDate expiryDate'
        )
        .sort({
          expiryDate: 1,
          receivedDate: 1
        })
        .lean()
    ]);

    const brands = [
      ...new Set(
        products
          .map((product) => product.supplierName)
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));

    const now = new Date();

    const formattedBatches = batches.map((batch) => {
      let status = 'active';
      let daysUntilExpiry = null;

      if (batch.expiryDate) {
        const expiryDate = new Date(batch.expiryDate);

        daysUntilExpiry = Math.ceil(
          (expiryDate - now) /
            (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 180) {
          status = 'expiring_soon';
        }
      }

      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,

        productId:
          batch.productId?._id ||
          batch.productId,

        productName:
          batch.productId?.name ||
          'Unknown Product',

        sku:
          batch.productId?.sku ||
          '',

        warehouseId:
          batch.warehouseId?._id ||
          batch.warehouseId,

        warehouseName:
          batch.warehouseId?.name ||
          '',

        quantity: batch.quantity,
        remainingQty: batch.remainingQty,

        receivedDate: batch.receivedDate,
        expiryDate: batch.expiryDate,

        status,
        daysUntilExpiry
      };
    });

    res.json({
      success: true,

      categories,

      products: products.map((product) => ({
        _id: product._id,
        name: product.name,
        supplierName: product.supplierName,

        categoryId:
          product.categoryId?._id ||
          product.categoryId,

        categoryName:
          product.categoryId?.name ||
          ''
      })),

      brands,

      batches: formattedBatches
    });
  } catch (err) {
    console.error(
      'getDiscountOptions error:',
      err
    );

    res.status(500).json({
      message:
        err.message ||
        'Failed to load discount options.'
    });
  }
};

exports.getActivePromotion = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const subtotal = Number(req.query.subtotal) || 0;
    const rawItems = req.query.items ? JSON.parse(req.query.items) : [];
    const cartItems = await prepareCartItemsForPromotions(tenantId, rawItems);

    const discounts = await StoreDiscount.find({ tenantId, isActive: true }).lean();
    const eligibleDiscounts = getEligibleStoreDiscounts(discounts, cartItems, subtotal);
    
    const promotionResult = applyPromotions({
      subtotal,
      cartItems,
      storeDiscounts: eligibleDiscounts,
      coupon: null
    });
    
    const previews = promotionResult.appliedStoreDiscounts.map((d) => ({
      ...d,
      label: formatDiscountLabel(d)
    }));
    
    res.json({ success: true, activeDiscounts: previews, storeDiscountAmount: promotionResult.storeDiscountAmount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load active promotion.' });
  }
};

exports.validateCouponCode = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { code, subtotal = 0, items = [] } = req.body;
    const normalizedCode = String(code || '').trim().toUpperCase();
    const cartItems = await prepareCartItemsForPromotions(tenantId, items);
    const numericSubtotal = Number(subtotal) || 0;

    if (!normalizedCode) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    const coupon = await Coupon.findOne({ tenantId, code: normalizedCode }).lean();
    if (!coupon) {
      return res.status(400).json({ message: 'Coupon not found.' });
    }


    const storeDiscounts = await StoreDiscount.find({ tenantId, isActive: true }).lean();
    const eligibleDiscounts = getEligibleStoreDiscounts(storeDiscounts, cartItems, numericSubtotal);
    const promotionPreview = applyPromotions({
      subtotal: numericSubtotal,
      cartItems,
      storeDiscounts: eligibleDiscounts,
      coupon: null
    });
    const afterStoreDiscount = promotionPreview.discountedSubtotal;

    const validation = validateCoupon(coupon, afterStoreDiscount);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const promotionResult = applyPromotions({
      subtotal: numericSubtotal,
      cartItems,
      storeDiscounts: eligibleDiscounts,
      coupon: validation.coupon
    });
    res.json({
      success: true,
      coupon: {
        ...validation.coupon,
        amount: promotionResult.couponDiscountAmount,
        label: formatDiscountLabel(validation.coupon)
      },
      storeDiscountAmount: promotionResult.storeDiscountAmount,
      couponDiscountAmount: promotionResult.couponDiscountAmount,
      discountedSubtotal: promotionResult.discountedSubtotal
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to validate coupon.' });
  }
};

exports.previewTotals = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { subtotal = 0, couponCode, items = [] } = req.body;
    const numericSubtotal = Number(subtotal) || 0;
    const cartItems = await prepareCartItemsForPromotions(tenantId, items);

    const storeDiscounts = await StoreDiscount.find({ tenantId, isActive: true }).lean();
    const eligibleDiscounts = getEligibleStoreDiscounts(storeDiscounts, cartItems, numericSubtotal);

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        tenantId,
        code: String(couponCode).trim().toUpperCase()
      }).lean();
    }

    const promotionResult = applyPromotions({
      subtotal: numericSubtotal,
      cartItems,
      storeDiscounts: eligibleDiscounts,
      coupon
    });
    const itemDiscountedSubtotal = Math.max(
      numericSubtotal - promotionResult.storeDiscountAmount,
      0
    );
    
    res.json({
      success: true,
    
      // Original cart subtotal
      originalSubtotal: numericSubtotal,
    
      // Subtotal after product/store discounts
      subtotal: itemDiscountedSubtotal,
    
      // Individual product discounts
      itemPromotions: promotionResult.itemPromotions || [],
    
      storeDiscounts: promotionResult.appliedStoreDiscounts.map((d) => ({
        ...d,
        label: formatDiscountLabel(d)
      })),
    
      coupon: promotionResult.appliedCoupon
        ? {
            ...promotionResult.appliedCoupon,
            amount: promotionResult.couponDiscountAmount,
            label: formatDiscountLabel(
              promotionResult.appliedCoupon
            )
          }
        : null,
    
      storeDiscountAmount:
        promotionResult.storeDiscountAmount,
    
      couponDiscountAmount:
        promotionResult.couponDiscountAmount,
    
      // Final subtotal AFTER coupon
      discountedSubtotal:
        promotionResult.discountedSubtotal,
    
      totalDiscount:
        promotionResult.totalDiscount
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to preview totals.' });
  }
};