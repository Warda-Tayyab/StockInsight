// Vertical industries with subtypes
export const ALL_VERTICALS_ARRAY = [
  { verticalId: 'education', subTypeIds: ['school', 'college', 'university'] },
  { verticalId: 'healthcare', subTypeIds: ['hospital', 'clinic', 'lab'] },
  { verticalId: 'technology', subTypeIds: ['software', 'consulting', 'startup'] },
  { verticalId: 'finance_banking', subTypeIds: ['bank', 'insurance', 'investment'] },
  { verticalId: 'government_public', subTypeIds: ['municipal', 'federal', 'public_service'] },
  { verticalId: 'manufacturing', subTypeIds: ['automotive', 'electronics', 'textile'] },
  { verticalId: 'law_firm', subTypeIds: [] },
  { verticalId: 'immigration', subTypeIds: [] },
  { verticalId: 'call_center', subTypeIds: [] },
] as const;

// Extract all vertical IDs for type checking
export const ALL_VERTICALS = ALL_VERTICALS_ARRAY.map(v => v.verticalId);

// Subscription plans
export const PLANS = ['trial', 'active', 'suspended', 'closed'] as const;

// Cloud regions
export const REGIONS = [
  { id: 'us-east-1', label: 'US East (Virginia)' },
  { id: 'us-west-2', label: 'US West (Oregon)' },
  { id: 'eu-central-1', label: 'EU Central (Frankfurt)' },
] as const;

// Timezone options
export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Kolkata'
] as const;

// Feature flags
export const FEATURE_FLAGS = [
  'tickets',
  'knowledge_base',
  'automation',
  'reporting',
  'analytics',
  'api_access',
  'integrations',
  'custom_fields',
  'mobile_app',
  'webhooks'
] as const;

// Module flags
export const MODULE_FLAGS = [
  'helpdesk',
  'asset_management',
  'problem_management',
  'reporting',
  'service_catalog',
  'change_management',
  'knowledge_management'
] as const;

// Use cases
export const USE_CASES = [
  'Customer Support',
  'Service Desk',
  'Change Management',
  'Project Management',
  'Internal IT',
  'Incident Management',
  'Asset Management'
] as const;

// Wizard steps
export const WIZARD_STEPS = [
  { id: 'basic', label: 'Basic Info', description: 'Company and admin details' },
  { id: 'address', label: 'Address & Settings', description: 'Location and tenant configuration' },
  { id: 'business', label: 'Business', description: 'Industry and use cases' },
  { id: 'features', label: 'Features & Quotas', description: 'Platform capabilities and limits' },
] as const;

// Form field labels and descriptions
export const FIELD_LABELS = {
  companyName: 'Company Name',
  slug: 'Subdomain',
  contactName: 'Primary Contact Name',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Phone',
  timezone: 'Timezone',
  adminFirstName: 'Admin First Name',
  adminLastName: 'Admin Last Name',
  adminEmail: 'Admin Email',
  adminPassword: 'Admin Password',
  street: 'Street Address',
  city: 'City',
  state: 'State/Province',
  zip: 'ZIP/Postal Code',
  status: 'Subscription Plan',
  region: 'Data Region',
  mfaRequiredForAll: 'Require MFA for all users',
  ssoEnabled: 'Enable SSO',
  auditLoggingEnabled: 'Enable audit logging',
  trialDays: 'Trial Days',
  verticals: 'Industry Verticals',
  primaryVertical: 'Primary Vertical',
  subType: 'Subcategory',
  useCases: 'Use Cases',
  features: 'Features',
  modules: 'Modules',
  userSeats: 'User Seats',
  storageGb: 'Storage (GB)',
  ticketsPerMonth: 'Tickets per Month',
  apiRps: 'API Requests per Second',
} as const;
