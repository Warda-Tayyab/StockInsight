import { z } from 'zod';
import { 
  ALL_VERTICALS, 
  PLANS, 
  REGIONS, 
  TIMEZONES, 
  FEATURE_FLAGS, 
  MODULE_FLAGS, 
  USE_CASES,
  ALL_VERTICALS_ARRAY 
} from './constants';

// Step 1 - Basic Info Schema
export const basicInfoSchema = z.object({
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  
  slug: z.string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/, 
      'Subdomain must contain only lowercase letters, numbers, and hyphens. Cannot start or end with hyphen.'),
  
  contactName: z.string()
    .min(1, 'Contact name is required'),
  
  contactEmail: z.string()
    .email('Invalid email address'),
  
  contactPhone: z.string()
    .regex(/^\+?[1-9]\d{7,15}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  
  timezone: z.enum(TIMEZONES, {
    message: 'Please select a valid timezone'
  }),
  
  adminFirstName: z.string()
    .min(1, 'Admin first name is required'),
  
  adminLastName: z.string()
    .min(1, 'Admin last name is required'),
  
  adminEmail: z.string()
    .email('Invalid admin email address'),
  
  adminPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number')
    .optional()
    .or(z.literal(''))
});

// Step 2 - Address & Settings Schema
export const addressSettingsSchema = z.object({
  street: z.string()
    .min(1, 'Street address is required'),
  
  city: z.string()
    .min(1, 'City is required'),
  
  state: z.string()
    .min(1, 'State/Province is required'),
  
  zip: z.string()
    .min(3, 'ZIP/Postal code must be at least 3 characters')
    .max(12, 'ZIP/Postal code must be less than 12 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid ZIP/Postal code format'),
  
  status: z.enum(PLANS, {
    message: 'Please select a valid plan'
  }),
  
  region: z.string().refine((val) => REGIONS.some(r => r.id === val), {
    message: 'Please select a valid region'
  }),
  
  mfaRequiredForAll: z.boolean().default(false),
  ssoEnabled: z.boolean().default(false),
  auditLoggingEnabled: z.boolean().default(true),
  
  trialDays: z.number()
    .min(0, 'Trial days cannot be negative')
    .max(60, 'Trial days cannot exceed 60')
    .optional()
}).refine((data: { status: string; trialDays?: number }) => {
  // If status is trial, trialDays should be present and valid
  if (data.status === 'trial') {
    return data.trialDays !== undefined && data.trialDays > 0;
  }
  return true;
}, {
  message: 'Trial days must be specified for trial plans',
  path: ['trialDays']
});

// Step 3 - Business Schema
export const businessSchema = z.object({
  verticals: z.array(z.string())
    .min(1, 'At least one industry vertical must be selected')
    .refine((vals) => vals.every(v => ALL_VERTICALS.includes(v as typeof ALL_VERTICALS[number])), {
      message: 'Invalid vertical selected'
    }),
  
  primaryVertical: z.string().optional(),
  
  subType: z.string().optional(),
  
  useCases: z.array(z.string())
    .min(1, 'At least one use case must be selected')
    .refine((vals) => vals.every(v => USE_CASES.includes(v as typeof USE_CASES[number])), {
      message: 'Invalid use case selected'
    })
}).refine((data: { primaryVertical?: string; verticals: string[] }) => {
  // If primary vertical is selected, it must be in the verticals array
  if (data.primaryVertical && !data.verticals.includes(data.primaryVertical)) {
    return false;
  }
  return true;
}, {
  message: 'Primary vertical must be selected from the chosen verticals',
  path: ['primaryVertical']
}).refine((data: { primaryVertical?: string; subType?: string }) => {
  // If primary vertical has subtypes, subType must be selected
  if (data.primaryVertical) {
    const vertical = ALL_VERTICALS_ARRAY.find(v => v.verticalId === data.primaryVertical);
    if (vertical && vertical.subTypeIds.length > 0) {
      return data.subType && (vertical.subTypeIds as readonly string[]).includes(data.subType);
    }
  }
  return true;
}, {
  message: 'Subcategory must be selected for this vertical',
  path: ['subType']
});

// Step 4 - Features & Quotas Schema
export const featuresQuotasSchema = z.object({
  features: z.array(z.string())
    .min(1, 'At least one feature must be selected')
    .refine((vals) => vals.every(v => FEATURE_FLAGS.includes(v as typeof FEATURE_FLAGS[number])), {
      message: 'Invalid feature selected'
    }),
  
  modules: z.array(z.string())
    .min(1, 'At least one module must be selected')
    .refine((vals) => vals.every(v => MODULE_FLAGS.includes(v as typeof MODULE_FLAGS[number])), {
      message: 'Invalid module selected'
    }),
  
  userSeats: z.number()
    .min(1, 'User seats must be at least 1'),
  
  storageGb: z.number()
    .min(0, 'Storage cannot be negative'),
  
  ticketsPerMonth: z.number()
    .min(0, 'Tickets per month cannot be negative'),
  
  apiRps: z.number()
    .min(0, 'API requests per second cannot be negative')
});

// Combined schema for the entire wizard
export const createTenantWizardSchema = z.object({
  // Step 1
  ...basicInfoSchema.shape,
  
  // Step 2
  ...addressSettingsSchema.shape,
  
  // Step 3
  ...businessSchema.shape,
  
  // Step 4
  ...featuresQuotasSchema.shape
});

// Schema for the final API payload
export const createTenantPayloadSchema = z.object({
  companyName: z.string(),
  slug: z.string(),
  primaryContact: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string().default('USA'),
      zipCode: z.string()
    })
  }),
  adminEmail: z.string(),
  adminPassword: z.string().optional(),
  adminFirstName: z.string(),
  adminLastName: z.string(),
  status: z.enum(PLANS),
  region: z.string(),
  isolationMode: z.literal('shared').default('shared'),
  trial: z.object({
    days: z.number(),
    startsAt: z.string()
  }).optional(),
  security: z.object({
    mfaRequired: z.boolean(),
    passwordPolicy: z.object({
      minLength: z.number().default(8),
      requireUppercase: z.boolean().default(true),
      requireNumbers: z.boolean().default(true),
      requireSpecialChars: z.boolean().default(false),
      maxAge: z.number().default(90)
    }),
    ssoEnabled: z.boolean(),
    auditEnabled: z.boolean()
  }),
  verticals: z.array(z.string()),
  useCases: z.array(z.string()),
  org: z.object({
    siteMode: z.literal('single').default('single'),
    sites: z.array(z.object({
      id: z.string().default('default'),
      name: z.string().default('Main Site')
    })).default([{ id: 'default', name: 'Main Site' }]),
    brandMode: z.literal('single').default('single')
  }),
  channels: z.object({
    email: z.object({
      enabled: z.boolean().default(true),
      inbound: z.boolean().default(true),
      outbound: z.boolean().default(true)
    }),
    web: z.object({
      enabled: z.boolean().default(true)
    }),
    mobile: z.object({
      enabled: z.boolean().default(false)
    })
  }),
  features: z.array(z.string()),
  modules: z.array(z.string()),
  quotas: z.object({
    seats: z.number(),
    storageGB: z.number(),
    ticketsPerMonth: z.number(),
    apiRps: z.number()
  }),
  verticalId: z.string().optional(),
  subTypeId: z.string().optional()
});

// Type exports
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type AddressSettingsFormData = z.infer<typeof addressSettingsSchema>;
export type BusinessFormData = z.infer<typeof businessSchema>;
export type FeaturesQuotasFormData = z.infer<typeof featuresQuotasSchema>;
export type CreateTenantWizardFormData = z.infer<typeof createTenantWizardSchema>;
export type CreateTenantPayload = z.infer<typeof createTenantPayloadSchema>;
