import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  createTenantWizardSchema,
  type CreateTenantWizardFormData,
} from './schemas';
import { 
  basicInfoSchema,
  addressSettingsSchema,
  businessSchema,
  featuresQuotasSchema
} from './schemas';
import { checkSubdomainAvailability, createTenant } from '@/superadmin-apis/tenants';
import { WIZARD_STEPS } from './constants';

const SUBDOMAIN_CHECK_DEBOUNCE = 400;

interface SubdomainAvailability {
  isChecking: boolean;
  isAvailable: boolean | null;
  error?: string;
}

interface TenantCreationResponse {
  success: boolean;
  data: {
    tenant: {
      tenantId: string;
      slug: string;
      companyName: string;
      status: string;
      region: string;
      ownerUserId: string;
      ownerPassword?: string;
      ownerInvite: {
        type: string;
        code: string;
        expiresAt: string;
      };
      createdAt: string;
    };
  };
}

interface UseCreateTenantReturn {
  // Form management
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Step management
  currentStep: number;
  currentStepId: string;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  
  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  
  // Subdomain checking
  subdomainAvailability: SubdomainAvailability;
  checkSlugAvailability: (slug: string) => void;
  
  // Form submission
  isSubmitting: boolean;
  submitForm: () => Promise<void>;
  
  // Success modal
  isSuccessModalOpen: boolean;
  successData: TenantCreationResponse | null;
  closeSuccessModal: () => void;
  
  // Utilities
  getStepSchema: (stepIndex: number) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  buildFinalPayload: (formData: CreateTenantWizardFormData) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const stepSchemas = [basicInfoSchema, addressSettingsSchema, businessSchema, featuresQuotasSchema];

// Extract data for a specific step
const extractStepData = (data: CreateTenantWizardFormData, stepIndex: number) => {
  switch (stepIndex) {
    case 0: // Basic Info
      return {
        companyName: data.companyName,
        slug: data.slug,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        timezone: data.timezone,
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword
      };
    case 1: // Address & Settings
      return {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        status: data.status,
        region: data.region,
        mfaRequiredForAll: data.mfaRequiredForAll,
        ssoEnabled: data.ssoEnabled,
        auditLoggingEnabled: data.auditLoggingEnabled,
        trialDays: data.trialDays
      };
    case 2: // Business
      return {
        verticals: data.verticals,
        primaryVertical: data.primaryVertical,
        subType: data.subType,
        useCases: data.useCases
      };
    case 3: // Features & Quotas
      return {
        features: data.features,
        modules: data.modules,
        userSeats: data.userSeats,
        storageGb: data.storageGb,
        ticketsPerMonth: data.ticketsPerMonth,
        apiRps: data.apiRps
      };
    default:
      return {};
  }
};

export function useCreateTenant(): UseCreateTenantReturn {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [subdomainAvailability, setSubdomainAvailability] = useState<SubdomainAvailability>({
    isChecking: false,
    isAvailable: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainCheckTimeout, setSubdomainCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<TenantCreationResponse | null>(null);

  // Initialize form with default values
  const form = useForm<CreateTenantWizardFormData>({
    resolver: zodResolver(createTenantWizardSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: 'onBlur',
    defaultValues: {
      companyName: '',
      slug: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      timezone: 'America/New_York',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      status: 'trial',
      region: 'us-east-1',
      mfaRequiredForAll: false,
      ssoEnabled: false,
      auditLoggingEnabled: true,
      trialDays: 14,
      verticals: [],
      primaryVertical: '',
      subType: '',
      useCases: [],
      features: [],
      modules: [],
      userSeats: 50,
      storageGb: 10,
      ticketsPerMonth: 1000,
      apiRps: 100
    }
  });

  // Watch form values for validation
  const formValues = form.watch();

  // Subdomain availability checker with debouncing
  const checkSlugAvailability = useCallback((slug: string) => {
    if (!slug || slug.length < 2) {
      setSubdomainAvailability({ isChecking: false, isAvailable: null });
      return;
    }

    // Clear existing timeout
    setSubdomainCheckTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });

    setSubdomainAvailability({ isChecking: true, isAvailable: null });

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkSubdomainAvailability(slug);
        setSubdomainAvailability({
          isChecking: false,
          isAvailable: result.available,
          error: result.available ? undefined : result.message
        });
      } catch {
        setSubdomainAvailability({
          isChecking: false,
          isAvailable: null,
          error: 'Failed to check availability'
        });
      }
    }, SUBDOMAIN_CHECK_DEBOUNCE);

    setSubdomainCheckTimeout(timeoutId);
  }, []);

  // Watch slug field and check availability
  const slugValue = form.watch('slug');
  useEffect(() => {
    if (slugValue) {
      checkSlugAvailability(slugValue);
    }
  }, [slugValue, checkSlugAvailability]);

  // Step management
  const currentStepId = WIZARD_STEPS[currentStep]?.id || 'basic';
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  // Validate current step
  const getStepSchema = (stepIndex: number) => stepSchemas[stepIndex];
  
  const canProceed = (() => {
    const currentStepSchema = getStepSchema(currentStep);
    if (!currentStepSchema) return false;

    try {
      const stepData = extractStepData(formValues, currentStep);
      console.log('Step data for validation:', stepData);
      console.log('Current step:', currentStep);
      
      const result = currentStepSchema.parse(stepData);
      console.log('Validation passed:', result);
      
      // Additional check for subdomain availability on step 1
      if (currentStep === 0) {
        console.log('Subdomain availability:', subdomainAvailability);
        if (subdomainAvailability.isAvailable === false) {
          console.log('Subdomain not available, blocking proceed');
          return false;
        }
      }
      
      console.log('Can proceed: true');
      return true;
    } catch (error) {
      console.log('Validation failed:', error);
      return false;
    }
  })();

  // Navigation functions
  const goToNextStep = () => {
    if (canProceed && !isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  };

  // Build final API payload
  const buildFinalPayload = (formData: CreateTenantWizardFormData): any => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const payload: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      companyName: formData.companyName,
      slug: formData.slug,
      primaryContact: {
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone || '',
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: 'USA',
          zipCode: formData.zip
        },
        timezone: formData.timezone
      },
      adminEmail: formData.adminEmail,
      adminPassword: formData.adminPassword || undefined,
      adminFirstName: formData.adminFirstName,
      adminLastName: formData.adminLastName,
      status: formData.status,
      region: formData.region,
      isolationMode: 'shared',
      security: {
        mfaRequired: formData.mfaRequiredForAll,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          maxAge: 90
        },
        ssoEnabled: formData.ssoEnabled,
        auditEnabled: formData.auditLoggingEnabled
      },
      verticals: formData.verticals,
      useCases: formData.useCases,
      org: {
        siteMode: 'single',
        sites: [{ id: 'default', name: 'Main Site' }],
        brandMode: 'single'
      },
      channels: {
        email: { enabled: true, inbound: true, outbound: true },
        web: { enabled: true },
        mobile: { enabled: false }
      },
      features: formData.features,
      modules: formData.modules,
      quotas: {
        seats: formData.userSeats,
        storageGB: formData.storageGb,
        ticketsPerMonth: formData.ticketsPerMonth,
        apiRps: formData.apiRps
      }
    };

    // Add trial configuration if status is trial
    if (formData.status === 'trial' && formData.trialDays) {
      payload.trial = {
        days: formData.trialDays,
        startsAt: new Date().toISOString()
      };
    }

    // Add primary vertical configuration if selected
    if (formData.primaryVertical) {
      payload.verticalId = formData.primaryVertical;
      if (formData.subType) {
        payload.subTypeId = formData.subType;
      }
    }

    return payload;
  };

  // Form submission
  const submitForm = async () => {
    try {
      setIsSubmitting(true);

      // Final validation
      const formData = form.getValues();
      const validatedData = createTenantWizardSchema.parse(formData);

      // Build and validate payload
      const payload = buildFinalPayload(validatedData);

      // Submit to API
      const result = await createTenant(payload);

      if (result.success) {
        setSuccessData(result as unknown as TenantCreationResponse);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error('Failed to create tenant');
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error creating tenant:', error);
      
      // Handle specific API errors
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData.message?.includes('subdomain')) {
          form.setError('slug', { message: 'Subdomain is already taken' });
          goToStep(0); // Go back to first step
        } else if (errorData.message?.includes('admin email')) {
          form.setError('adminEmail', { message: 'Admin email already exists' });
          goToStep(0);
        }
      } else if (error.response?.status === 422) {
        // Validation errors
        const errorData = error.response.data;
        if (errorData.details) {
          errorData.details.forEach((detail: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (detail.path) {
              form.setError(detail.path, { message: detail.message });
            }
          });
        }
      } else {
        // Generic error
        toast.error(error.message || 'Failed to create tenant. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subdomainCheckTimeout) {
        clearTimeout(subdomainCheckTimeout);
      }
    };
  }, [subdomainCheckTimeout]);

  // Close success modal
  const closeSuccessModal = useCallback(() => {
    setIsSuccessModalOpen(false);
    setSuccessData(null);
    // Navigate after closing modal
    if (successData?.data?.tenant?.tenantId) {
      router.push(`/tenant-management/${successData.data.tenant.tenantId}`);
    } else {
      router.push('/tenant-management');
    }
  }, [successData, router]);

  return {
    form,
    currentStep,
    currentStepId,
    canProceed,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    subdomainAvailability,
    checkSlugAvailability,
    isSubmitting,
    submitForm,
    isSuccessModalOpen,
    successData,
    closeSuccessModal,
    getStepSchema,
    buildFinalPayload
  };
}
