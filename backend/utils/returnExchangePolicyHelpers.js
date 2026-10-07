const calculateSaleTax = (subtotal, taxRatePercent = 8) => {
  const safeSubtotal = Number(subtotal || 0);
  const safeRate = Number(taxRatePercent || 0);

  if (!safeSubtotal || safeRate <= 0) {
    return 0;
  }

  return Number((safeSubtotal * (safeRate / 100)).toFixed(2));
};

module.exports = {
  calculateSaleTax
};
