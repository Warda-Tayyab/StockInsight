/** Format currency for report displays */
export const formatMoney = (amount, decimals = 0) => {
  const n = Number(amount) || 0;
  return `Rs.${n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals > 0 ? decimals : 2,
  })}`;
};

export default formatMoney;
