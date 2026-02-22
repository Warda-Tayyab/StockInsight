import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Users, Database, Zap, Plus, Minus } from 'lucide-react';
import { FEATURE_FLAGS, MODULE_FLAGS, FIELD_LABELS } from './constants';

interface StepFeaturesQuotasProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function StepFeaturesQuotas({ form }: StepFeaturesQuotasProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  
  const watchedFeatures = watch('features') || [];
  const watchedModules = watch('modules') || [];

  // Handle feature selection
  const handleFeatureChange = (feature: string, checked: boolean) => {
    const newFeatures = checked 
      ? [...watchedFeatures, feature]
      : watchedFeatures.filter((f: string) => f !== feature);
    
    setValue('features', newFeatures);
  };

  // Handle module selection
  const handleModuleChange = (module: string, checked: boolean) => {
    const newModules = checked 
      ? [...watchedModules, module]
      : watchedModules.filter((m: string) => m !== module);
    
    setValue('modules', newModules);
  };

  // Quota adjustment helpers
  const adjustQuota = (field: string, delta: number) => {
    const currentValue = watch(field) || 0;
    const newValue = Math.max(0, currentValue + delta);
    setValue(field, newValue);
  };

  return (
    <div className="space-y-6">
      {/* Features */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">{FIELD_LABELS.features}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Select the features that will be available to your tenant users.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURE_FLAGS.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={feature}
                checked={watchedFeatures.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, !!checked)}
              />
              <Label 
                htmlFor={feature}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
        
        {errors.features && (
          <p className="text-red-500 text-sm mt-2">{errors.features.message}</p>
        )}
      </div>

      {/* Modules */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">{FIELD_LABELS.modules}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Choose the functional modules that will be enabled for this tenant.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULE_FLAGS.map((module) => (
            <div key={module} className="flex items-center space-x-2">
              <Checkbox
                id={module}
                checked={watchedModules.includes(module)}
                onCheckedChange={(checked) => handleModuleChange(module, !!checked)}
              />
              <Label 
                htmlFor={module}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
        
        {errors.modules && (
          <p className="text-red-500 text-sm mt-2">{errors.modules.message}</p>
        )}
      </div>

      {/* Quotas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Resource Quotas</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Set resource limits and quotas for this tenant.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Seats */}
          <div>
            <Label htmlFor="userSeats" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {FIELD_LABELS.userSeats} *
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('userSeats', -10)}
                disabled={watch('userSeats') <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="userSeats"
                type="number"
                min="1"
                {...register('userSeats', { valueAsNumber: true })}
                className={`text-center ${errors.userSeats ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('userSeats', 10)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.userSeats && (
              <p className="text-red-500 text-sm mt-1">{errors.userSeats.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Maximum number of users</p>
          </div>

          {/* Storage */}
          <div>
            <Label htmlFor="storageGb" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {FIELD_LABELS.storageGb} *
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('storageGb', -5)}
                disabled={watch('storageGb') <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="storageGb"
                type="number"
                min="0"
                {...register('storageGb', { valueAsNumber: true })}
                className={`text-center ${errors.storageGb ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('storageGb', 5)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.storageGb && (
              <p className="text-red-500 text-sm mt-1">{errors.storageGb.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Storage quota in GB</p>
          </div>

          {/* Tickets per Month */}
          <div>
            <Label htmlFor="ticketsPerMonth" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {FIELD_LABELS.ticketsPerMonth} *
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('ticketsPerMonth', -100)}
                disabled={watch('ticketsPerMonth') <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="ticketsPerMonth"
                type="number"
                min="0"
                {...register('ticketsPerMonth', { valueAsNumber: true })}
                className={`text-center ${errors.ticketsPerMonth ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('ticketsPerMonth', 100)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.ticketsPerMonth && (
              <p className="text-red-500 text-sm mt-1">{errors.ticketsPerMonth.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Monthly ticket creation limit</p>
          </div>

          {/* API RPS */}
          <div>
            <Label htmlFor="apiRps" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {FIELD_LABELS.apiRps} *
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('apiRps', -10)}
                disabled={watch('apiRps') <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="apiRps"
                type="number"
                min="0"
                {...register('apiRps', { valueAsNumber: true })}
                className={`text-center ${errors.apiRps ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustQuota('apiRps', 10)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.apiRps && (
              <p className="text-red-500 text-sm mt-1">{errors.apiRps.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">API requests per second limit</p>
          </div>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          These quotas and features can be adjusted later through the tenant management interface. 
          Choose conservative values initially and scale up as needed.
        </AlertDescription>
      </Alert>
    </div>
  );
}
