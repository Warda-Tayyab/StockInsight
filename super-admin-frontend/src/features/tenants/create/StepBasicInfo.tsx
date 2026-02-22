import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { TIMEZONES, FIELD_LABELS } from './constants';

interface StepBasicInfoProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  subdomainAvailability: {
    isChecking: boolean;
    isAvailable: boolean | null;
    error?: string;
  };
}

export default function StepBasicInfo({ form, subdomainAvailability }: StepBasicInfoProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  
  const watchedSlug = watch('slug');

  // Memoize className to avoid re-renders
  const slugInputClassName = useMemo(() => {
    const baseClass = 'pr-20';
    if (errors.slug || subdomainAvailability.isAvailable === false) {
      return `${baseClass} border-red-500`;
    }
    if (subdomainAvailability.isAvailable === true) {
      return `${baseClass} border-green-500`;
    }
    return baseClass;
  }, [errors.slug, subdomainAvailability.isAvailable]);

  // Render subdomain availability indicator
  const renderSubdomainStatus = () => {
    if (!watchedSlug || watchedSlug.length < 2) return null;

    if (subdomainAvailability.isChecking) {
      return (
        <div className="flex items-center text-blue-600 text-sm mt-1">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Checking availability...
        </div>
      );
    }

    if (subdomainAvailability.isAvailable === true) {
      return (
        <div className="flex items-center text-green-600 text-sm mt-1">
          <Check className="w-4 h-4 mr-2" />
          Available
        </div>
      );
    }

    if (subdomainAvailability.isAvailable === false) {
      return (
        <div className="flex items-center text-red-600 text-sm mt-1">
          <X className="w-4 h-4 mr-2" />
          {subdomainAvailability.error || 'Not available'}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">{FIELD_LABELS.companyName} *</Label>
            <Input
              id="companyName"
              {...register('companyName')}
              placeholder="Enter company name"
              className={errors.companyName ? 'border-red-500' : ''}
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">{FIELD_LABELS.slug} *</Label>
            <div className="relative">
              <Input
                id="slug"
                {...register('slug')}
                placeholder="your-company"
                className={slugInputClassName}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">.tickflo.com</span>
              </div>
            </div>
            {renderSubdomainStatus()}
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              This will be your subdomain (e.g., {watchedSlug || 'your-company'}.tickflo.com)
            </p>
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactName">{FIELD_LABELS.contactName} *</Label>
            <Input
              id="contactName"
              {...register('contactName')}
              placeholder="John Doe"
              className={errors.contactName ? 'border-red-500' : ''}
            />
            {errors.contactName && (
              <p className="text-red-500 text-sm mt-1">{errors.contactName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contactEmail">{FIELD_LABELS.contactEmail} *</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder="john.doe@company.com"
              className={errors.contactEmail ? 'border-red-500' : ''}
            />
            {errors.contactEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contactPhone">{FIELD_LABELS.contactPhone}</Label>
            <Input
              id="contactPhone"
              type="tel"
              {...register('contactPhone')}
              placeholder="+1234567890"
              className={errors.contactPhone ? 'border-red-500' : ''}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.contactPhone.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Include country code (e.g., +1)</p>
          </div>

          <div>
            <Label htmlFor="timezone">{FIELD_LABELS.timezone} *</Label>
            <Select value={watch('timezone')} onValueChange={(value) => setValue('timezone', value)}>
              <SelectTrigger className={errors.timezone ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="text-red-500 text-sm mt-1">{errors.timezone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adminFirstName">{FIELD_LABELS.adminFirstName} *</Label>
            <Input
              id="adminFirstName"
              {...register('adminFirstName')}
              placeholder="Jane"
              className={errors.adminFirstName ? 'border-red-500' : ''}
            />
            {errors.adminFirstName && (
              <p className="text-red-500 text-sm mt-1">{errors.adminFirstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="adminLastName">{FIELD_LABELS.adminLastName} *</Label>
            <Input
              id="adminLastName"
              {...register('adminLastName')}
              placeholder="Smith"
              className={errors.adminLastName ? 'border-red-500' : ''}
            />
            {errors.adminLastName && (
              <p className="text-red-500 text-sm mt-1">{errors.adminLastName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="adminEmail">{FIELD_LABELS.adminEmail} *</Label>
            <Input
              id="adminEmail"
              type="email"
              {...register('adminEmail')}
              placeholder="admin@company.com"
              className={errors.adminEmail ? 'border-red-500' : ''}
            />
            {errors.adminEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.adminEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="adminPassword">{FIELD_LABELS.adminPassword}</Label>
            <Input
              id="adminPassword"
              type="password"
              {...register('adminPassword')}
              placeholder="Leave blank to send invitation"
              className={errors.adminPassword ? 'border-red-500' : ''}
            />
            {errors.adminPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.adminPassword.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Optional. If left blank, an invitation email will be sent.
            </p>
          </div>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Make sure all information is accurate. The subdomain cannot be changed after creation.
        </AlertDescription>
      </Alert>
    </div>
  );
}
