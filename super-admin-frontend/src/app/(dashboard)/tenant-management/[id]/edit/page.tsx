"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, X, AlertTriangle, Building2, Shield, Settings, Users, AlertCircle } from 'lucide-react';
import { useTenant, useTenantActions } from '@/hooks/use-super-admin';
import type { UpdateTenantRequest } from '@/types/super-admin';
import { toast } from 'sonner';

const AVAILABLE_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

const AVAILABLE_VERTICALS = [
  'healthcare',
  'finance',
  'education',
  'technology',
  'retail',
  'manufacturing',
  'government',
  'non_profit',
  'other'
];

const AVAILABLE_USE_CASES = [
  'customer_support',
  'it_helpdesk',
  'project_management',
  'issue_tracking',
  'service_desk',
  'asset_management',
  'change_management',
  'incident_management'
];

const AVAILABLE_FEATURES = [
  'advanced_reporting',
  'custom_fields',
  'automation_rules',
  'api_access',
  'single_sign_on',
  'mobile_app',
  'email_integration',
  'slack_integration',
  'teams_integration'
];

const AVAILABLE_MODULES = [
  'tickets',
  'knowledge_base',
  'asset_management',
  'time_tracking',
  'project_management',
  'reporting',
  'automation',
  'integrations'
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney'
];

export default function TenantEditPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const { tenant, loading, error: fetchError, refetch } = useTenant(tenantId);
  const { updateTenant, loading: updating } = useTenantActions();

  const [formData, setFormData] = useState<UpdateTenantRequest>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when tenant loads
  useEffect(() => {
    if (tenant) {
      setFormData({
        companyName: tenant.companyName || '',
        slug: tenant.slug || '',
        status: tenant.status || 'trial',
        region: tenant.region || '',
        isolationMode: tenant.isolationMode || 'shared',
        primaryContact: {
          name: tenant.primaryContact?.name || '',
          email: tenant.primaryContact?.email || '',
          phone: tenant.primaryContact?.phone || '',
          timezone: tenant.primaryContact?.timezone || 'UTC',
          address: {
            street: tenant.primaryContact?.address?.street || '',
            city: tenant.primaryContact?.address?.city || '',
            state: tenant.primaryContact?.address?.state || '',
            country: tenant.primaryContact?.address?.country || '',
            zipCode: tenant.primaryContact?.address?.zipCode || '',
          }
        },
        trial: {
          days: tenant.trial?.days || 14,
        },
        security: {
          mfaRequired: tenant.security?.mfaRequired || false,
          ssoEnabled: tenant.security?.ssoEnabled || false,
          auditEnabled: tenant.security?.auditEnabled || true,
          passwordPolicy: {
            minLength: tenant.security?.passwordPolicy?.minLength || 8,
            requireUppercase: tenant.security?.passwordPolicy?.requireUppercase || false,
            requireNumbers: tenant.security?.passwordPolicy?.requireNumbers || false,
            requireSpecialChars: tenant.security?.passwordPolicy?.requireSpecialChars || false,
            maxAge: tenant.security?.passwordPolicy?.maxAge || 90,
          }
        },
        quotas: {
          seats: tenant.quotas?.seats || 50,
          storageGB: tenant.quotas?.storageGB || 10,
          ticketsPerMonth: tenant.quotas?.ticketsPerMonth || 1000,
          apiRps: tenant.quotas?.apiRps || 100,
        },
        verticals: tenant.verticals || [],
        useCases: tenant.useCases || [],
        features: tenant.features || [],
        modules: tenant.modules || [],
      });
    }
  }, [tenant]);

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/tenant-management/${tenantId}`);
      }
    } else {
      router.push(`/tenant-management/${tenantId}`);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      const keys = field.split('.');
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev[field as keyof UpdateTenantRequest] as string[] || [];
      const newArray = checked 
        ? [...current, value]
        : current.filter(item => item !== value);
      
      return {
        ...prev,
        [field]: newArray
      };
    });
    setHasChanges(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.companyName?.trim()) {
      newErrors['companyName'] = 'Company name is required';
    }

    if (!formData.slug?.trim()) {
      newErrors['slug'] = 'Subdomain is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors['slug'] = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.primaryContact?.email?.trim()) {
      newErrors['primaryContact.email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryContact.email)) {
      newErrors['primaryContact.email'] = 'Please enter a valid email address';
    }

    if (!formData.primaryContact?.name?.trim()) {
      newErrors['primaryContact.name'] = 'Contact name is required';
    }

    // Quota validation
    if (formData.quotas?.seats && formData.quotas.seats < 1) {
      newErrors['quotas.seats'] = 'Seats must be at least 1';
    }

    if (formData.quotas?.storageGB && formData.quotas.storageGB < 1) {
      newErrors['quotas.storageGB'] = 'Storage must be at least 1 GB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    try {
      const success = await updateTenant(tenantId, formData);
      if (success) {
        toast.success('Tenant updated successfully');
        setHasChanges(false);
        await refetch();
        router.push(`/tenant-management/${tenantId}`);
      }
    } catch {
      toast.error('Failed to update tenant');
    }
  };

  const getFieldError = (field: string) => errors[field];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (fetchError || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {fetchError || 'Tenant not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="w-6 h-6" />
              Edit Tenant
            </h2>
            <p className="text-muted-foreground">
              Update tenant configuration and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={updating}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updating || !hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="quotas">Quotas & Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                    className={getFieldError('companyName') ? 'border-red-500' : ''}
                  />
                  {getFieldError('companyName') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('companyName')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">Subdomain *</Label>
                  <div className="flex">
                    <Input
                      id="slug"
                      value={formData.slug || ''}
                      onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                      placeholder="company-name"
                      className={`rounded-r-none ${getFieldError('slug') ? 'border-red-500' : ''}`}
                    />
                    <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
                      .tickflo.com
                    </div>
                  </div>
                  {getFieldError('slug') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('slug')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status || 'trial'} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select 
                    value={formData.region || ''} 
                    onValueChange={(value) => handleInputChange('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_REGIONS.map(region => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="isolationMode">Isolation Mode</Label>
                  <Select 
                    value={formData.isolationMode || 'shared'} 
                    onValueChange={(value) => handleInputChange('isolationMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="dedicated">Dedicated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="trialDays">Trial Days</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.trial?.days || 14}
                    onChange={(e) => handleInputChange('trial.days', parseInt(e.target.value) || 0)}
                    placeholder="14"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Primary Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.primaryContact?.name || ''}
                    onChange={(e) => handleInputChange('primaryContact.name', e.target.value)}
                    placeholder="John Doe"
                    className={getFieldError('primaryContact.name') ? 'border-red-500' : ''}
                  />
                  {getFieldError('primaryContact.name') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('primaryContact.name')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.primaryContact?.email || ''}
                    onChange={(e) => handleInputChange('primaryContact.email', e.target.value)}
                    placeholder="john@company.com"
                    className={getFieldError('primaryContact.email') ? 'border-red-500' : ''}
                  />
                  {getFieldError('primaryContact.email') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('primaryContact.email')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.primaryContact?.phone || ''}
                    onChange={(e) => handleInputChange('primaryContact.phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.primaryContact?.timezone || 'UTC'} 
                    onValueChange={(value) => handleInputChange('primaryContact.timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="md:col-span-2">
                      <Input
                        value={formData.primaryContact?.address?.street || ''}
                        onChange={(e) => handleInputChange('primaryContact.address.street', e.target.value)}
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <Input
                        value={formData.primaryContact?.address?.city || ''}
                        onChange={(e) => handleInputChange('primaryContact.address.city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Input
                        value={formData.primaryContact?.address?.state || ''}
                        onChange={(e) => handleInputChange('primaryContact.address.state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Input
                        value={formData.primaryContact?.address?.country || ''}
                        onChange={(e) => handleInputChange('primaryContact.address.country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                    <div>
                      <Input
                        value={formData.primaryContact?.address?.zipCode || ''}
                        onChange={(e) => handleInputChange('primaryContact.address.zipCode', e.target.value)}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Verticals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABLE_VERTICALS.map(vertical => (
                  <div key={vertical} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`vertical-${vertical}`}
                      checked={(formData.verticals || []).includes(vertical)}
                      onChange={(e) => handleArrayChange('verticals', vertical, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`vertical-${vertical}`} className="text-sm font-normal capitalize">
                      {vertical.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABLE_USE_CASES.map(useCase => (
                  <div key={useCase} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`usecase-${useCase}`}
                      checked={(formData.useCases || []).includes(useCase)}
                      onChange={(e) => handleArrayChange('useCases', useCase, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`usecase-${useCase}`} className="text-sm font-normal capitalize">
                      {useCase.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABLE_FEATURES.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`feature-${feature}`}
                      checked={(formData.features || []).includes(feature)}
                      onChange={(e) => handleArrayChange('features', feature, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`feature-${feature}`} className="text-sm font-normal capitalize">
                      {feature.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABLE_MODULES.map(module => (
                  <div key={module} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`module-${module}`}
                      checked={(formData.modules || []).includes(module)}
                      onChange={(e) => handleArrayChange('modules', module, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`module-${module}`} className="text-sm font-normal capitalize">
                      {module.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mfaRequired">Multi-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require MFA for all users</p>
                  </div>
                  <Switch
                    id="mfaRequired"
                    checked={formData.security?.mfaRequired || false}
                    onCheckedChange={(checked) => handleInputChange('security.mfaRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ssoEnabled">Single Sign-On</Label>
                    <p className="text-sm text-muted-foreground">Enable SSO integration</p>
                  </div>
                  <Switch
                    id="ssoEnabled"
                    checked={formData.security?.ssoEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('security.ssoEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auditEnabled">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log user activities</p>
                  </div>
                  <Switch
                    id="auditEnabled"
                    checked={formData.security?.auditEnabled !== false}
                    onCheckedChange={(checked) => handleInputChange('security.auditEnabled', checked)}
                  />
                </div>
              </div>

              <div>
                <Label>Password Policy</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor="minLength">Minimum Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="32"
                      value={formData.security?.passwordPolicy?.minLength || 8}
                      onChange={(e) => handleInputChange('security.passwordPolicy.minLength', parseInt(e.target.value) || 8)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAge">Password Max Age (days)</Label>
                    <Input
                      id="maxAge"
                      type="number"
                      min="30"
                      max="365"
                      value={formData.security?.passwordPolicy?.maxAge || 90}
                      onChange={(e) => handleInputChange('security.passwordPolicy.maxAge', parseInt(e.target.value) || 90)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireUppercase"
                      checked={formData.security?.passwordPolicy?.requireUppercase || false}
                      onChange={(e) => handleInputChange('security.passwordPolicy.requireUppercase', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="requireUppercase" className="text-sm font-normal">
                      Require uppercase letters
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireNumbers"
                      checked={formData.security?.passwordPolicy?.requireNumbers || false}
                      onChange={(e) => handleInputChange('security.passwordPolicy.requireNumbers', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="requireNumbers" className="text-sm font-normal">
                      Require numbers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="requireSpecialChars"
                      checked={formData.security?.passwordPolicy?.requireSpecialChars || false}
                      onChange={(e) => handleInputChange('security.passwordPolicy.requireSpecialChars', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="requireSpecialChars" className="text-sm font-normal">
                      Require special characters
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Resource Quotas & Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seats">User Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    value={formData.quotas?.seats || 50}
                    onChange={(e) => handleInputChange('quotas.seats', parseInt(e.target.value) || 50)}
                    className={getFieldError('quotas.seats') ? 'border-red-500' : ''}
                  />
                  {getFieldError('quotas.seats') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('quotas.seats')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="storageGB">Storage (GB)</Label>
                  <Input
                    id="storageGB"
                    type="number"
                    min="1"
                    value={formData.quotas?.storageGB || 10}
                    onChange={(e) => handleInputChange('quotas.storageGB', parseInt(e.target.value) || 10)}
                    className={getFieldError('quotas.storageGB') ? 'border-red-500' : ''}
                  />
                  {getFieldError('quotas.storageGB') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('quotas.storageGB')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ticketsPerMonth">Monthly Tickets</Label>
                  <Input
                    id="ticketsPerMonth"
                    type="number"
                    min="1"
                    value={formData.quotas?.ticketsPerMonth || 1000}
                    onChange={(e) => handleInputChange('quotas.ticketsPerMonth', parseInt(e.target.value) || 1000)}
                  />
                </div>

                <div>
                  <Label htmlFor="apiRps">API Rate Limit (req/sec)</Label>
                  <Input
                    id="apiRps"
                    type="number"
                    min="1"
                    value={formData.quotas?.apiRps || 100}
                    onChange={(e) => handleInputChange('quotas.apiRps', parseInt(e.target.value) || 100)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              You have unsaved changes
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} disabled={updating}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updating}>
                <Save className="w-4 h-4 mr-2" />
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
