const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePurchaseReturnLoss } = require('../utils/purchaseReportHelpers');

test('calculates the loss when a purchase return is below original cost', () => {
  assert.equal(
    calculatePurchaseReturnLoss({ quantity: 3, originalUnitCost: 100, unitCost: 80 }),
    60
  );
});

test('does not create a loss when return value is equal to or above cost', () => {
  assert.equal(
    calculatePurchaseReturnLoss({ quantity: 3, originalUnitCost: 100, unitCost: 100 }),
    0
  );
  assert.equal(
    calculatePurchaseReturnLoss({ quantity: 3, originalUnitCost: 100, unitCost: 120 }),
    0
  );
});
