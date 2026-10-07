/** @module shared/utils/tenantBrand */

export const PLATFORM_NAME = 'StockInsight';

export const getTenantDisplayName = (user) => {
  const name = user?.tenant?.name || user?.tenant?.slug;
  if (name && String(name).trim()) return String(name).trim();
  return PLATFORM_NAME;
};

export const getTenantInitials = (user) => {
  const name = getTenantDisplayName(user);
  if (!name || name === PLATFORM_NAME) return 'SI';
  const parts = name.split(/[\s-_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
};

/** Auth screens before login — prefer typed/query slug */
export const getAuthBrandName = (slug) => {
  const s = String(slug || '').trim();
  return s || PLATFORM_NAME;
};
