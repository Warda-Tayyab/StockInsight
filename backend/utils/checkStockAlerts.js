const Stock = require('../models/tenant/Stock');

const checkStockAlerts = async ({
  totalQty,
  reorderLevel
}) => {

  const alerts = [];

  // 🔴 OUT OF STOCK
  if (totalQty === 0) {
    alerts.push({
      type: 'out-of-stock',
      message: 'Product is out of stock'
    });
  }

  // 🟡 LOW STOCK
  if (totalQty > 0 && totalQty <= reorderLevel) {
    alerts.push({
      type: 'low-stock',
      message: 'Product is low in stock'
    });
  }

  return { alerts };
};

module.exports = checkStockAlerts;