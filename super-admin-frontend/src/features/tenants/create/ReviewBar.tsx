import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Globe, MapPin, Users, Database, Settings } from 'lucide-react';
import { REGIONS } from './constants';

interface ReviewBarProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  currentStep: number;
}

export default function ReviewBar({ form }: ReviewBarProps) {
  const formData = form.watch();

  const getRegionLabel = (regionId: string) => {
    return REGIONS.find(r => r.id === regionId)?.label || regionId;
  };

  const getPrimaryVerticalLabel = (verticalId: string) => {
    return verticalId?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  };

  const getSubTypeLabel = (subType: string) => {
    return subType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Review Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Info */}
        {formData.companyName && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Building2 className="w-4 h-4" />
              Company
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-medium">{formData.companyName}</div>
              {formData.slug && (
                <div className="text-xs text-blue-600">
                  {formData.slug}.tickflo.com
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {formData.contactName && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Mail className="w-4 h-4" />
              Contact
            </div>
            <div className="text-sm text-gray-600">
              <div>{formData.contactName}</div>
              {formData.contactEmail && (
                <div className="text-xs">{formData.contactEmail}</div>
              )}
            </div>
          </div>
        )}

        {/* Location */}
        {formData.city && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <MapPin className="w-4 h-4" />
              Location
            </div>
            <div className="text-sm text-gray-600">
              <div>{formData.city}, {formData.state}</div>
              {formData.region && (
                <div className="text-xs">{getRegionLabel(formData.region)}</div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Plan & Settings */}
        {formData.status && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Globe className="w-4 h-4" />
              Plan
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={formData.status === 'trial' ? 'secondary' : 'default'}>
                {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1)}
              </Badge>
              {formData.status === 'trial' && formData.trialDays && (
                <span className="text-xs text-gray-500">
                  {formData.trialDays} days
                </span>
              )}
            </div>
          </div>
        )}

        {/* Business */}
        {formData.primaryVertical && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Building2 className="w-4 h-4" />
              Primary Vertical
            </div>
            <div className="text-sm text-gray-600">
              <div>{getPrimaryVerticalLabel(formData.primaryVertical)}</div>
              {formData.subType && (
                <div className="text-xs">{getSubTypeLabel(formData.subType)}</div>
              )}
            </div>
          </div>
        )}

        {/* Verticals Count */}
        {formData.verticals?.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-900 mb-1">
              Industry Verticals
            </div>
            <Badge variant="outline">
              {formData.verticals.length} selected
            </Badge>
          </div>
        )}

        {/* Use Cases Count */}
        {formData.useCases?.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-900 mb-1">
              Use Cases
            </div>
            <Badge variant="outline">
              {formData.useCases.length} selected
            </Badge>
          </div>
        )}

        <Separator />

        {/* Quotas */}
        {formData.userSeats && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Users className="w-4 h-4" />
              Resource Quotas
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {formData.userSeats && (
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span>{formData.userSeats}</span>
                </div>
              )}
              {formData.storageGb !== undefined && (
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span>{formData.storageGb} GB</span>
                </div>
              )}
              {formData.ticketsPerMonth !== undefined && (
                <div className="flex justify-between">
                  <span>Tickets/mo:</span>
                  <span>{formData.ticketsPerMonth}</span>
                </div>
              )}
              {formData.apiRps !== undefined && (
                <div className="flex justify-between">
                  <span>API RPS:</span>
                  <span>{formData.apiRps}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features Count */}
        {formData.features?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
              <Settings className="w-4 h-4" />
              Features
            </div>
            <Badge variant="outline">
              {formData.features.length} enabled
            </Badge>
          </div>
        )}

        {/* Modules Count */}
        {formData.modules?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
              <Database className="w-4 h-4" />
              Modules
            </div>
            <Badge variant="outline">
              {formData.modules.length} enabled
            </Badge>
          </div>
        )}

        {/* Security Badges */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900">Security</div>
          <div className="flex flex-wrap gap-2">
            {formData.mfaRequiredForAll && (
              <Badge variant="secondary" className="text-xs">MFA Required</Badge>
            )}
            {formData.ssoEnabled && (
              <Badge variant="secondary" className="text-xs">SSO Enabled</Badge>
            )}
            {formData.auditLoggingEnabled && (
              <Badge variant="secondary" className="text-xs">Audit Logging</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
