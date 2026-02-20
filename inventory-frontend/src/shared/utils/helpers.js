/** @module shared/utils/helpers */

export const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');

export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value ?? 0);

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export default { formatDate, formatCurrency, debounce };
