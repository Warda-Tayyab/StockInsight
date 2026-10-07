const INVENTORY_TYPES = require('../constants/inventoryTypes');

const getInventoryActivity = (type, quantity) => {
  switch (type) {
    case INVENTORY_TYPES.STOCK_IN:
      return {
        text: `Received ${quantity} units`,
        icon: '📦'
      };

    case INVENTORY_TYPES.STOCK_OUT:
      return {
        text: `Stock-out ${quantity} units`,
        icon: '📤'
      };

    case INVENTORY_TYPES.SALE:
      return {
        text: `Sold ${quantity} units`,
        icon: '💰'
      };

    case INVENTORY_TYPES.ADJUST:
      return {
        text: `Adjusted ${quantity} units`,
        icon: '✏️'
      };

    case INVENTORY_TYPES.RETURN:
      return {
        text: `Returned ${quantity} units (restocked)`,
        icon: '↩️'
      };

    case INVENTORY_TYPES.EXCHANGE:
      return {
        text: `Exchange out ${quantity} units`,
        icon: '🔄'
      };

    case INVENTORY_TYPES.WRITE_OFF:
      return {
        text: `Written off ${quantity} units (not restocked)`,
        icon: '🗑️'
      };

    case INVENTORY_TYPES.PURCHASE_RECEIVE:
      return {
        text: `Purchase received ${quantity} units`,
        icon: '🛒'
      };

    case INVENTORY_TYPES.TRANSFER_OUT:
      return {
        text: `Transferred out ${quantity} units`,
        icon: '🚚'
      };

    case INVENTORY_TYPES.TRANSFER_IN:
      return {
        text: `Transferred in ${quantity} units`,
        icon: '📥'
      };

    case INVENTORY_TYPES.PURCHASE_RETURN:
      return {
        text: `Purchase returned ${quantity} units`,
        icon: '↩️'
      };

    default:
      return {
        text: `${type} ${quantity} units`,
        icon: '📦'
      };
  }
};

module.exports = getInventoryActivity;