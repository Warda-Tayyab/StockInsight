/** @module shared/utils/roles */

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STAFF: 'staff', // legacy
};

/** Inventory / reports — owner & manager */
export const FULL_ACCESS_ROLES = [ROLES.OWNER, ROLES.MANAGER];

/** Settings hub — owner only */
export const SETTINGS_ROLES = [ROLES.OWNER];

export const POS_ROLES = [ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF];

export const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  staff: 'Cashier',
};

export const normalizeRole = (role) =>
  role === ROLES.STAFF ? ROLES.CASHIER : role;

export const hasFullAccess = (role) => FULL_ACCESS_ROLES.includes(role);

export const canAccessSettings = (role) => SETTINGS_ROLES.includes(role);

export const canAccessPos = (role) => POS_ROLES.includes(role);

export const getRoleLabel = (role) =>
  ROLE_LABELS[role] || role || 'User';
