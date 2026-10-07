/** @module pos/utils/promotionCartItems */

export const buildPromotionCartItems = (cart = []) =>
  cart.map((item) => ({
    productId: item.product.id,
    categoryId: item.product.categoryId,
    supplierName: item.product.supplierName,

    lineTotal:
      Number(item.product.price || 0) *
      (Number(item.quantity) || 0),

    quantity: Number(item.quantity) || 0,

    // IMPORTANT
    costPrice: Number(item.product.costPrice || 0),
  }));
