const Product = require('../models/tenant/Product');
const { getExpiringLineTotal, getSelectedBatchLineTotal } = require('./batchAllocationHelper');

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const isWithinDateRange = (startDate, endDate, now = new Date()) => {
  if (startDate && now < new Date(startDate)) return false;
  if (endDate && now > new Date(endDate)) return false;
  return true;
};

const normalizeId = (value) => String(value || '');

const normalizeBrandName = (value) => String(value || '').trim().toLowerCase();

const calculateDiscountAmount = (baseAmount, type, value) => {
  if (baseAmount <= 0 || value <= 0) return 0;

  let amount = 0;
  if (type === 'percentage') {
    amount = baseAmount * (value / 100);
  } else {
    amount = value;
  }

  return roundMoney(Math.min(amount, baseAmount));
};
const validateDiscountAgainstCostPrice = async ({
  tenantId,
  type,
  value,
  scope,
  productIds = [],
  categoryIds = [],
  brandNames = [],
  batchIds = []
}) => {
  const numericValue = Number(value);

  if (!numericValue || numericValue <= 0) {
    return {
      valid: false,
      message: 'Discount value must be greater than zero.'
    };
  }

  if (type === 'percentage' && numericValue > 100) {
    return {
      valid: false,
      message: 'Percentage discount cannot exceed 100%.'
    };
  }

  /*
   * Find products affected by this discount.
   */
  let filter = {
    tenantId,
    status: 'active'
  };

  if (scope === 'product') {
    filter._id = { $in: productIds };
  }

 

  /*
   * Batch discounts:
   * Find the products belonging to the selected batches.
   */
  if (scope === 'batch') {
    const batches = await require('../models/tenant/Batch')
      .find({
        _id: { $in: batchIds },
        tenantId
      })
      .select('productId')
      .lean();

    const affectedProductIds = batches
      .map((batch) => batch.productId)
      .filter(Boolean);

    if (!affectedProductIds.length) {
      return {
        valid: false,
        message: 'No valid products found for the selected batches.'
      };
    }

    filter._id = {
      $in: affectedProductIds
    };
  }

  const products = await Product.find(filter)
    .select('_id name costPrice sellingPrice')
    .lean();

  if (!products.length) {
    return {
      valid: false,
      message: 'No valid products found for this discount.'
    };
  }

  /*
   * Check every affected product.
   */
  for (const product of products) {
    const costPrice = Number(product.costPrice) || 0;
    const sellingPrice = Number(product.sellingPrice) || 0;

    if (sellingPrice <= 0) {
      return {
        valid: false,
        message: `Discount cannot be applied to "${product.name}" because its selling price is invalid.`
      };
    }

    /*
     * Maximum discount allowed before selling price
     * reaches cost price.
     *
     * Example:
     * Cost = 10
     * Selling = 20
     *
     * Maximum discount = 20 - 10 = Rs.10
     * Maximum percentage = 10 / 20 * 100 = 50%
     */
    const maximumDiscountAmount = roundMoney(
      Math.max(sellingPrice - costPrice, 0)
    );

    const maximumDiscountPercentage = roundMoney(
      Math.max(
        ((sellingPrice - costPrice) / sellingPrice) * 100,
        0
      )
    );

    let requestedDiscountAmount = 0;

    if (type === 'percentage') {
      requestedDiscountAmount = roundMoney(
        sellingPrice * (numericValue / 100)
      );
    } else {
      requestedDiscountAmount = roundMoney(numericValue);
    }

    /*
     * Discount would take selling price below cost.
     */
    if (requestedDiscountAmount > maximumDiscountAmount) {
      if (type === 'percentage') {
        return {
          valid: false,
          maximumAllowed: maximumDiscountPercentage,
          maximumAllowedAmount: maximumDiscountAmount,
          message:
            `Maximum discount for "${product.name}" is ${maximumDiscountPercentage}%. ` +
            `Please enter a discount of ${maximumDiscountPercentage}% or less.`
        };
      }

      return {
        valid: false,
        maximumAllowed: maximumDiscountAmount,
        maximumAllowedAmount: maximumDiscountAmount,
        message:
          `Maximum discount for "${product.name}" is Rs.${maximumDiscountAmount.toFixed(2)}. ` +
          `Please enter a discount of Rs.${maximumDiscountAmount.toFixed(2)} or less.`
      };
    }
  }

  return {
    valid: true
  };
};
const getScopedDiscountBase = (
  cartItems = [],
  promotion,
  now = new Date()
) => {
  if (!promotion || !cartItems.length) return 0;

  const scope = promotion.scope;

  if (scope === 'product') {
    const productIds = new Set(
      (promotion.productIds || []).map(normalizeId)
    );

    return cartItems
      .filter((item) =>
        productIds.has(normalizeId(item.productId))
      )
      .reduce(
        (sum, item) => sum + (item.lineTotal || 0),
        0
      );
  }

  if (scope === 'batch') {
    return cartItems.reduce(
      (sum, item) =>
        sum +
        getSelectedBatchLineTotal(
          item,
          promotion.batchIds
        ),
      0
    );
  }

  return 0;
};

const getEligibleStoreDiscounts = (
  discounts,
  cartItems = [],
  orderSubtotal = 0,
  now = new Date()
) => {
  if (!discounts?.length || orderSubtotal <= 0) return [];

  return discounts.filter((discount) => {
    if (!discount.isActive) return false;
    if (!['product', 'batch'].includes(discount.scope)) {
      return false;
    }
    if (!isWithinDateRange(discount.startDate, discount.endDate, now)) {
      return false;
    }

    

    // Check whether this discount matches at least one cart item
    const scopedBase = getScopedDiscountBase(
      cartItems,
      discount,
      now
    );

    if (scopedBase <= 0) {
      return false;
    }

    return true;
  });
};

const validateCoupon = (coupon, subtotal, now = new Date()) => {
  if (!coupon) {
    return { valid: false, message: 'Coupon not found.' };
  }

  if (!coupon.isActive) {
    return { valid: false, message: 'This coupon is inactive.' };
  }

  if (!isWithinDateRange(coupon.startDate, coupon.endDate, now)) {
    return { valid: false, message: 'This coupon has expired or is not yet active.' };
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'This coupon has reached its usage limit.' };
  }

  if (subtotal < (coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      message: `Minimum order amount of $${(coupon.minOrderAmount || 0).toFixed(2)} required for this coupon.`
    };
  }

  return { valid: true, coupon };
};

const applyPromotions = ({
  subtotal,
  cartItems = [],
  storeDiscounts = [],
  coupon,
  now = new Date()
}) => {
  if (!cartItems.length || subtotal <= 0) {
    return {
      storeDiscountAmount: 0,
      appliedStoreDiscounts: [],
      couponDiscountAmount: 0,
      discountedSubtotal: roundMoney(subtotal),
      totalDiscount: 0,
      couponScopedBase: 0,
      appliedCoupon: null
    };
  }

  /*
   * =====================================================
   * STORE DISCOUNTS
   * =====================================================
   *
   * Each item gets ONLY ONE best applicable store discount.
   *
   * Example:
   * Product = Rs.1000
   *
   * Discount A = 10%  -> Rs.100
   * Discount B = 20%  -> Rs.200
   *
   * Only Discount B will apply.
   */

  const activeStoreDiscounts = storeDiscounts.filter((discount) => {
    if (!discount.isActive) return false;
  
    if (!['product', 'batch'].includes(discount.scope)) {
      return false;
    }
  
    if (
      !isWithinDateRange(
        discount.startDate,
        discount.endDate,
        now
      )
    ) {
      return false;
    }
  
    return true;
  });
  let storeDiscountAmount = 0;
  const appliedStoreDiscountsMap = new Map();
  
  const itemPromotions = [];

  for (const item of cartItems) {
    const applicableDiscounts = activeStoreDiscounts.filter(
      (discount) => {
        const scope = discount.scope || 'all';

       // Product discount
if (scope === 'product') {
  return (discount.productIds || []).some(
    (id) =>
      normalizeId(id) ===
      normalizeId(item.productId)
  );
}

// Batch discount
if (scope === 'batch') {
  return (
    getSelectedBatchLineTotal(
      item,
      discount.batchIds
    ) > 0
  );
}

return false;

        return false;
      }
    );

    if (!applicableDiscounts.length) {
      continue;
    }

    /*
     * Calculate every applicable discount for this item
     * and choose the one giving the highest actual discount.
     */

    const calculatedDiscounts = applicableDiscounts
    .map((discount) => {
      let scopedBase = item.lineTotal || 0;

      if (discount.scope === 'batch') {
        scopedBase = getSelectedBatchLineTotal(
          item,
          discount.batchIds
        );
      }
  
      if (scopedBase <= 0) {
        return null;
      }
  
      const amount = calculateDiscountAmount(
        scopedBase,
        discount.type,
        discount.value
      );
  
      if (amount <= 0) {
        return null;
      }
  
      /*
       * COST PRICE PROTECTION
       *
       * Discounted selling price must never go
       * below the product's cost price.
       */
  
      const quantity = Number(item.quantity) || 0;
      const costPrice = Number(item.costPrice) || 0;
  
      if (quantity > 0 && costPrice > 0) {
        const minimumAllowedLineTotal =
          roundMoney(costPrice * quantity);
  
        const discountedLineTotal =
          roundMoney(Math.max(scopedBase - amount, 0));
  
        /*
         * For normal product/category/brand/all discounts,
         * the discount cannot reduce the product below cost.
         */
        if (discountedLineTotal < minimumAllowedLineTotal) {
          return null;
        }
      }
  
      return {
        ...discount,
        amount,
        scopedBase
      };
    })
    .filter(Boolean);

    if (!calculatedDiscounts.length) {
      continue;
    }

    /*
     * ONLY THE HIGHEST ACTUAL DISCOUNT WINS
     */
    calculatedDiscounts.sort(
      (a, b) => b.amount - a.amount
    );

    const bestDiscount = calculatedDiscounts[0];

    const amount = roundMoney(bestDiscount.amount);
    
    const originalLineTotal = roundMoney(item.lineTotal || 0);
    
    const discountPercentage =
    bestDiscount.type === 'percentage'
      ? Number(bestDiscount.value)
      : 0;
    
      itemPromotions.push({
        productId: item.productId,
      
        discountId: bestDiscount._id,
      
        discountName: bestDiscount.name,
      
        // IMPORTANT: percentage / fixed
        discountType: bestDiscount.type,
      
        // Original configured value
        // percentage => 20
        // fixed => 200
        discountValue: Number(bestDiscount.value),
      
        // Actual Rs amount discounted
        discountAmount: amount,
      
        // Only percentage discounts have percentage value
        discountPercentage,
      
        scopedBase: bestDiscount.scopedBase,
      
        originalLineTotal,
      
        discountedLineTotal: roundMoney(
          Math.max(originalLineTotal - amount, 0)
        )
      });
    storeDiscountAmount = roundMoney(
      storeDiscountAmount + amount
    );

    const key = String(bestDiscount._id);

    if (!appliedStoreDiscountsMap.has(key)) {
      appliedStoreDiscountsMap.set(key, {
        ...bestDiscount,
        amount: 0,
        scopedBase: 0
      });
    }

    const existing = appliedStoreDiscountsMap.get(key);

    existing.amount = roundMoney(
      existing.amount + amount
    );

    existing.scopedBase = roundMoney(
      existing.scopedBase +
        bestDiscount.scopedBase
    );
  }

  const appliedStoreDiscounts = Array.from(
    appliedStoreDiscountsMap.values()
  );

  /*
   * =====================================================
   * COUPON
   * =====================================================
   *
   * Coupon is NOT item-specific.
   *
   * It applies to the TOTAL BILL only.
   *
   * Coupon should only have:
   * - Minimum order amount
   * - Active status
   * - Date validity
   * - Usage limit
   *
   * No Applies To / product / category / brand / batch.
   */

  let couponDiscountAmount = 0;
  let appliedCoupon = null;
  let couponScopedBase = 0;

  if (coupon) {
    const subtotalAfterStoreDiscount = roundMoney(
      Math.max(
        subtotal - storeDiscountAmount,
        0
      )
    );

    const couponValidation = validateCoupon(
      coupon,
      subtotalAfterStoreDiscount,
      now
    );

    if (couponValidation.valid) {
      couponScopedBase =
        subtotalAfterStoreDiscount;

      couponDiscountAmount =
        calculateDiscountAmount(
          couponScopedBase,
          coupon.type,
          coupon.value
        );

      if (couponDiscountAmount > 0) {
        appliedCoupon = coupon;
      }
    }
  }

  /*
   * =====================================================
   * FINAL TOTAL
   * =====================================================
   */

  const totalDiscount = roundMoney(
    storeDiscountAmount +
      couponDiscountAmount
  );

  const discountedSubtotal = roundMoney(
    Math.max(
      subtotal - totalDiscount,
      0
    )
  );

  return {
    storeDiscountAmount,
  
    appliedStoreDiscounts,
  
    itemPromotions,
  
    couponDiscountAmount,
  
    discountedSubtotal,
  
    totalDiscount,
  
    couponScopedBase,
  
    appliedCoupon:
      couponDiscountAmount > 0
        ? appliedCoupon
        : null
  };
};

const formatScopeLabel = (promotion) => {
  if (!promotion) return '';

  switch (promotion.scope) {
    case 'product':
      return 'Product discount';

    case 'batch':
      return 'Specific batch discount';

    default:
      return '';
  }
};

module.exports = {
  roundMoney,
  isWithinDateRange,
  calculateDiscountAmount,
  validateDiscountAgainstCostPrice,
  getScopedDiscountBase,
  getEligibleStoreDiscounts,
  validateCoupon,
  applyPromotions,
  formatScopeLabel
};
