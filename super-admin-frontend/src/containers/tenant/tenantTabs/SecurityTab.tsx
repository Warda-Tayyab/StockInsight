"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, X, RotateCcw } from 'lucide-react';
import { getTenantSecurity, updateTenantSecurity, resetTenantSecurity } from '@/superadmin-apis/tenants';
import type { Tenant, Security } from '@/types/super-admin';
import { toast } from 'sonner';

interface SecurityTabProps {
  tenant: Tenant;
}

export default function SecurityTab({ tenant }: SecurityTabProps) {
  const [security, setSecurity] = useState<Security | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ipAllowInput, setIpAllowInput] = useState('');
  const [ipDenyInput, setIpDenyInput] = useState('');

  useEffect(() => {
    fetchSecuritySettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.tenantId]);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      const response = await getTenantSecurity(tenant.tenantId);
      if (response.success && response.data) {
        setSecurity(response.data.security);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
      toast.error('Failed to fetch security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async (field: keyof Security, value: Security[keyof Security]) => {
    if (!security) return;

    try {
      setSaving(true);
      const updatedSecurity = { ...security, [field]: value };
      // Remove passwordPolicy from the payload as it's not meant to be updated via API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordPolicy, ...securityDataToUpdate } = updatedSecurity;
      const response = await updateTenantSecurity(tenant.tenantId, securityDataToUpdate);

      if (response.success && response.data) {
        setSecurity(response.data.security);
        toast.success('Security settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddIpAllow = async () => {
    if (!ipAllowInput.trim() || !security) return;

    try {
      setSaving(true);
      const newIpAllow = [...(security.ipAllow || []), ipAllowInput.trim()];
      const updatedSecurity = { ...security, ipAllow: newIpAllow };
      // Remove passwordPolicy from the payload as it's not meant to be updated via API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordPolicy, ...securityDataToUpdate } = updatedSecurity;
      const response = await updateTenantSecurity(tenant.tenantId, securityDataToUpdate);

      if (response.success && response.data) {
        setSecurity(response.data.security);
        setIpAllowInput('');
        toast.success('IP address added to allow list');
      }
    } catch (error) {
      console.error('Error adding IP to allow list:', error);
      toast.error('Failed to add IP address');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveIpAllow = async (index: number) => {
    if (!security?.ipAllow) return;

    try {
      setSaving(true);
      const newIpAllow = security.ipAllow.filter((_, i) => i !== index);
      const updatedSecurity = { ...security, ipAllow: newIpAllow };
      // Remove passwordPolicy from the payload as it's not meant to be updated via API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordPolicy, ...securityDataToUpdate } = updatedSecurity;
      const response = await updateTenantSecurity(tenant.tenantId, securityDataToUpdate);

      if (response.success && response.data) {
        setSecurity(response.data.security);
        toast.success('IP address removed from allow list');
      }
    } catch (error) {
      console.error('Error removing IP from allow list:', error);
      toast.error('Failed to remove IP address');
    } finally {
      setSaving(false);
    }
  };

  const handleAddIpDeny = async () => {
    if (!ipDenyInput.trim() || !security) return;

    try {
      setSaving(true);
      const newIpDeny = [...(security.ipDeny || []), ipDenyInput.trim()];
      const updatedSecurity = { ...security, ipDeny: newIpDeny };
      // Remove passwordPolicy from the payload as it's not meant to be updated via API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordPolicy, ...securityDataToUpdate } = updatedSecurity;
      const response = await updateTenantSecurity(tenant.tenantId, securityDataToUpdate);

      if (response.success && response.data) {
        setSecurity(response.data.security);
        setIpDenyInput('');
        toast.success('IP address added to deny list');
      }
    } catch (error) {
      console.error('Error adding IP to deny list:', error);
      toast.error('Failed to add IP address');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveIpDeny = async (index: number) => {
    if (!security?.ipDeny) return;

    try {
      setSaving(true);
      const newIpDeny = security.ipDeny.filter((_, i) => i !== index);
      const updatedSecurity = { ...security, ipDeny: newIpDeny };
      // Remove passwordPolicy from the payload as it's not meant to be updated via API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordPolicy, ...securityDataToUpdate } = updatedSecurity;
      const response = await updateTenantSecurity(tenant.tenantId, securityDataToUpdate);

      if (response.success && response.data) {
        setSecurity(response.data.security);
        toast.success('IP address removed from deny list');
      }
    } catch (error) {
      console.error('Error removing IP from deny list:', error);
      toast.error('Failed to remove IP address');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setSaving(true);
      const response = await resetTenantSecurity(tenant.tenantId);

      if (response.success && response.data) {
        setSecurity(response.data.security);
        toast.success('Security settings reset to defaults');
      }
    } catch (error) {
      console.error('Error resetting security settings:', error);
      toast.error('Failed to reset security settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!security) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load security settings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication & Authorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="mfa-required">Multi-Factor Authentication Required</Label>
              <p className="text-sm text-muted-foreground">
                Require all users to use MFA for enhanced security
              </p>
            </div>
            <Switch
              id="mfa-required"
              checked={security.mfaRequired}
              onCheckedChange={(checked) => handleSecurityUpdate('mfaRequired', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sso-enabled">Single Sign-On Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to authenticate via SSO providers
              </p>
            </div>
            <Switch
              id="sso-enabled"
              checked={security.ssoEnabled}
              onCheckedChange={(checked) => handleSecurityUpdate('ssoEnabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="audit-enabled">Audit Logging Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Log all security-related events for compliance
              </p>
            </div>
            <Switch
              id="audit-enabled"
              checked={security.auditEnabled}
              onCheckedChange={(checked) => handleSecurityUpdate('auditEnabled', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IP Access Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Allowed IP Addresses</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Only allow access from these IP addresses (leave empty to allow all)
              </p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="192.168.1.1"
                  value={ipAllowInput}
                  onChange={(e) => setIpAllowInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIpAllow()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddIpAllow}
                  disabled={!ipAllowInput.trim() || saving}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {security.ipAllow?.map((ip, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {ip}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveIpAllow(index)}
                      disabled={saving}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Blocked IP Addresses</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Block access from these IP addresses
              </p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="192.168.1.1"
                  value={ipDenyInput}
                  onChange={(e) => setIpDenyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIpDeny()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddIpDeny}
                  disabled={!ipDenyInput.trim() || saving}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {security.ipDeny?.map((ip, index) => (
                  <Badge key={index} variant="destructive" className="flex items-center gap-1">
                    {ip}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveIpDeny(index)}
                      disabled={saving}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {security.passwordPolicy && (
        <Card>
          <CardHeader>
            <CardTitle>Password Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Minimum Length:</span> {security.passwordPolicy.minLength || 8} characters
              </div>
              <div>
                <span className="font-medium">Uppercase Required:</span> {security.passwordPolicy.requireUppercase ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Numbers Required:</span> {security.passwordPolicy.requireNumbers ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Special Characters Required:</span> {security.passwordPolicy.requireSpecialChars ? 'Yes' : 'No'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Password Max Age:</span> {security.passwordPolicy.maxAge || 90} days
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
