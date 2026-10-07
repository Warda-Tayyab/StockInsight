/** Tenant role helpers — owner & manager = full access; cashier = POS only */

const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  /** @deprecated legacy — treated like cashier */
  STAFF: 'staff',
};

const POS_ROLES = [ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF];

/** Inventory / reports — owner & manager */
const FULL_ACCESS_ROLES = [ROLES.OWNER, ROLES.MANAGER];

/** Settings hub — owner only */
const SETTINGS_ROLES = [ROLES.OWNER];

const INVITABLE_ROLES = [ROLES.MANAGER, ROLES.CASHIER];

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  staff: 'Cashier',
};

const normalizeRole = (role) => (role === ROLES.STAFF ? ROLES.CASHIER : role);

const hasFullAccess = (role) => FULL_ACCESS_ROLES.includes(role);

const canAccessSettings = (role) => SETTINGS_ROLES.includes(role);

const canAccessPos = (role) => POS_ROLES.includes(role);

module.exports = {
  ROLES,
  FULL_ACCESS_ROLES,
  SETTINGS_ROLES,
  POS_ROLES,
  INVITABLE_ROLES,
  ROLE_LABELS,
  normalizeRole,
  hasFullAccess,
  canAccessSettings,
  canAccessPos,
};
