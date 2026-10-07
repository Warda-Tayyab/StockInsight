const test = require('node:test');
const assert = require('node:assert/strict');

function buildNotificationMessage({ type, productName, batchNumber, qty, locationName, locationType }) {
  const locLabel = locationName
    ? `${locationName} (${locationType === 'warehouse' ? 'Warehouse' : 'Store'})`
    : 'location';

  if (type === 'expired') {
    return `🔴 EXPIRED PRODUCT: ${productName} (Batch: ${batchNumber}) has EXPIRED at ${locLabel}`;
  }
  if (type === 'expiring') {
    return `🟠 EXPIRING SOON: ${productName} (Batch: ${batchNumber}) is expiring soon at ${locLabel}`;
  }
  if (type === 'out-of-stock') {
    return `🚨 OUT OF STOCK: ${productName} is out of stock at ${locLabel}`;
  }
  if (type === 'low-stock') {
    return `⚠️ LOW STOCK: ${productName} is running low in stock (${qty} remaining) at ${locLabel}`;
  }
  return '';
}

test('includes location name and location type in expired product notification message', () => {
  const msg = buildNotificationMessage({
    type: 'expired',
    productName: 'Green Tea Box',
    batchNumber: 'BAT-2026-001',
    locationName: 'City Mart',
    locationType: 'store',
  });
  assert.match(msg, /City Mart \(Store\)/);
  assert.match(msg, /Green Tea Box/);
  assert.match(msg, /BAT-2026-001/);
});

test('includes location name and location type in low stock notification message', () => {
  const msg = buildNotificationMessage({
    type: 'low-stock',
    productName: 'Milk 1L',
    qty: 4,
    locationName: 'Main Warehouse',
    locationType: 'warehouse',
  });
  assert.match(msg, /Main Warehouse \(Warehouse\)/);
  assert.match(msg, /Milk 1L/);
  assert.match(msg, /4 remaining/);
});
