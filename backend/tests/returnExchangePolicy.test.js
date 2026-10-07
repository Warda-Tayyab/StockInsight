const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSaleTax } = require('../utils/returnExchangePolicyHelpers');

test('calculateSaleTax applies the configured percentage and rounds to two decimals', () => {
  assert.equal(calculateSaleTax(100, 8), 8);
  assert.equal(calculateSaleTax(100, 10), 10);
  assert.equal(calculateSaleTax(99.99, 8.5), 8.5);
});
