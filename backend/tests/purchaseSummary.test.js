const test = require('node:test');
const assert = require('node:assert/strict');

function calculateEffectiveReceiptAmount(receipt) {
  if (receipt.subtotal && receipt.subtotal > 0) {
    return receipt.subtotal;
  }
  return (receipt.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0
  );
}

test('calculates purchase amount using subtotal when available', () => {
  const receipt = {
    subtotal: 320000,
    items: [
      { quantity: 2, unitCost: 100000 },
      { quantity: 1, unitCost: 120000 },
    ],
  };
  assert.equal(calculateEffectiveReceiptAmount(receipt), 320000);
});

test('calculates purchase amount from items when subtotal is missing or zero', () => {
  const receipt = {
    subtotal: 0,
    items: [
      { quantity: 2, unitCost: 100000 },
      { quantity: 1, unitCost: 120000 },
    ],
  };
  assert.equal(calculateEffectiveReceiptAmount(receipt), 320000);
});
