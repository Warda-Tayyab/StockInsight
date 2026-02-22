import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { PLANS, REGIONS, FIELD_LABELS } from './constants';

interface StepAddressSettingsProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function StepAddressSettings({ form }: StepAddressSettingsProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  
  const watchedStatus = watch('status');
  const watchedSsoEnabled = watch('ssoEnabled');

  return (
    <div className="space-y-6">
      {/* Address Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="street">{FIELD_LABELS.street} *</Label>
            <Input
              id="street"
              {...register('street')}
              placeholder="123 Main Street"
              className={errors.street ? 'border-red-500' : ''}
            />
            {errors.street && (
              <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="city">{FIELD_LABELS.city} *</Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="New York"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">{FIELD_LABELS.state} *</Label>
            <Input
              id="state"
              {...register('state')}
              placeholder="NY"
              className={errors.state ? 'border-red-500' : ''}
            />
            {errors.state && (
              <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="zip">{FIELD_LABELS.zip} *</Label>
            <Input
              id="zip"
              {...register('zip')}
              placeholder="10001"
              className={errors.zip ? 'border-red-500' : ''}
            />
            {errors.zip && (
              <p className="text-red-500 text-sm mt-1">{errors.zip.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tenant Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tenant Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">{FIELD_LABELS.status} *</Label>
            <Select value={watch('status')} onValueChange={(value) => setValue('status', value)}>
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="region">{FIELD_LABELS.region} *</Label>
            <Select value={watch('region')} onValueChange={(value) => setValue('region', value)}>
              <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.region && (
              <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Choose the data center closest to your users
            </p>
          </div>

          {watchedStatus === 'trial' && (
            <div>
              <Label htmlFor="trialDays">{FIELD_LABELS.trialDays}</Label>
              <Input
                id="trialDays"
                type="number"
                min="1"
                max="60"
                {...register('trialDays', { valueAsNumber: true })}
                placeholder="14"
                className={errors.trialDays ? 'border-red-500' : ''}
              />
              {errors.trialDays && (
                <p className="text-red-500 text-sm mt-1">{errors.trialDays.message}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">1-60 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mfaRequiredForAll">{FIELD_LABELS.mfaRequiredForAll}</Label>
              <p className="text-sm text-gray-500">
                Require all users to enable two-factor authentication
              </p>
            </div>
            <Switch
              id="mfaRequiredForAll"
              checked={watch('mfaRequiredForAll')}
              onCheckedChange={(checked) => setValue('mfaRequiredForAll', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ssoEnabled">{FIELD_LABELS.ssoEnabled}</Label>
              <p className="text-sm text-gray-500">
                Enable Single Sign-On integration
              </p>
            </div>
            <Switch
              id="ssoEnabled"
              checked={watch('ssoEnabled')}
              onCheckedChange={(checked) => setValue('ssoEnabled', checked)}
            />
          </div>

          {watchedSsoEnabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                SSO configuration can be completed later in the Integrations section of the admin panel.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auditLoggingEnabled">{FIELD_LABELS.auditLoggingEnabled}</Label>
              <p className="text-sm text-gray-500">
                Enable comprehensive audit logging for security and compliance
              </p>
            </div>
            <Switch
              id="auditLoggingEnabled"
              checked={watch('auditLoggingEnabled')}
              onCheckedChange={(checked) => setValue('auditLoggingEnabled', checked)}
            />
          </div>
        </div>
      </div>

      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These settings can be modified later in the tenant administration panel.
        </AlertDescription>
      </Alert>
    </div>
  );
}
