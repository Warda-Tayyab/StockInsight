import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Target } from 'lucide-react';
import { ALL_VERTICALS_ARRAY, USE_CASES, FIELD_LABELS } from './constants';

interface StepBusinessProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function StepBusiness({ form }: StepBusinessProps) {
  const { formState: { errors }, watch, setValue } = form;
  
  const watchedVerticals = watch('verticals') || [];
  const watchedPrimaryVertical = watch('primaryVertical');

  // Get available subtypes for the primary vertical
  const primaryVerticalData = ALL_VERTICALS_ARRAY.find(v => v.verticalId === watchedPrimaryVertical);
  const hasSubtypes = primaryVerticalData && primaryVerticalData.subTypeIds.length > 0;

  // Handle vertical selection
  const handleVerticalChange = (verticalId: string, checked: boolean) => {
    const newVerticals = checked 
      ? [...watchedVerticals, verticalId]
      : watchedVerticals.filter((id: string) => id !== verticalId);
    
    setValue('verticals', newVerticals);

    // Clear primary vertical if it's no longer selected
    if (!checked && watchedPrimaryVertical === verticalId) {
      setValue('primaryVertical', '');
      setValue('subType', '');
    }
  };

  // Handle primary vertical change
  const handlePrimaryVerticalChange = (verticalId: string) => {
    setValue('primaryVertical', verticalId);
    setValue('subType', ''); // Clear subtype when primary changes
  };

  // Handle use case selection
  const watchedUseCases = watch('useCases') || [];
  const handleUseCaseChange = (useCase: string, checked: boolean) => {
    const newUseCases = checked 
      ? [...watchedUseCases, useCase]
      : watchedUseCases.filter((uc: string) => uc !== useCase);
    
    setValue('useCases', newUseCases);
  };

  return (
    <div className="space-y-6">
      {/* Industry Verticals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">{FIELD_LABELS.verticals}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Select all industry verticals that apply to your organization. This helps us provide relevant features and templates.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_VERTICALS_ARRAY.map((vertical) => (
            <div key={vertical.verticalId} className="flex items-center space-x-2">
              <Checkbox
                id={vertical.verticalId}
                checked={watchedVerticals.includes(vertical.verticalId)}
                onCheckedChange={(checked) => handleVerticalChange(vertical.verticalId, !!checked)}
              />
              <Label 
                htmlFor={vertical.verticalId}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {vertical.verticalId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
        
        {errors.verticals && (
          <p className="text-red-500 text-sm mt-2">{errors.verticals.message}</p>
        )}
      </div>

      {/* Primary Vertical */}
      {watchedVerticals.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{FIELD_LABELS.primaryVertical}</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose your primary industry vertical. This will be used to configure default permissions and templates.
          </p>
          
          <Select 
            value={watchedPrimaryVertical || ''} 
            onValueChange={handlePrimaryVerticalChange}
          >
            <SelectTrigger className={errors.primaryVertical ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select primary vertical" />
            </SelectTrigger>
            <SelectContent>
              {watchedVerticals.map((verticalId: string) => (
                <SelectItem key={verticalId} value={verticalId}>
                  {verticalId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {errors.primaryVertical && (
            <p className="text-red-500 text-sm mt-1">{errors.primaryVertical.message}</p>
          )}
        </div>
      )}

      {/* Subcategory */}
      {hasSubtypes && watchedPrimaryVertical && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{FIELD_LABELS.subType}</h3>
          <p className="text-sm text-gray-600 mb-4">
            Specify the subcategory for more targeted configuration.
          </p>
          
          <Select 
            value={watch('subType') || ''} 
            onValueChange={(value) => setValue('subType', value)}
          >
            <SelectTrigger className={errors.subType ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {primaryVerticalData?.subTypeIds.map((subType) => (
                <SelectItem key={subType} value={subType}>
                  {subType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {errors.subType && (
            <p className="text-red-500 text-sm mt-1">{errors.subType.message}</p>
          )}
        </div>
      )}

      {/* Use Cases */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">{FIELD_LABELS.useCases}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Select the primary use cases for your ticketing system. This helps us customize workflows and features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {USE_CASES.map((useCase) => (
            <div key={useCase} className="flex items-center space-x-2">
              <Checkbox
                id={useCase}
                checked={watchedUseCases.includes(useCase)}
                onCheckedChange={(checked) => handleUseCaseChange(useCase, !!checked)}
              />
              <Label 
                htmlFor={useCase}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {useCase}
              </Label>
            </div>
          ))}
        </div>
        
        {errors.useCases && (
          <p className="text-red-500 text-sm mt-2">{errors.useCases.message}</p>
        )}
      </div>

      {/* Information Alert */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          Your selections will help us pre-configure templates, workflows, and permissions that are most relevant to your business needs.
        </AlertDescription>
      </Alert>
    </div>
  );
}
