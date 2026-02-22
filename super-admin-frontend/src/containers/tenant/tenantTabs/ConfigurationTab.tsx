"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { getTenantMailing, createTenantMailing, updateTenantMailing, deleteTenantMailing } from '@/superadmin-apis/tenants';
import type { Tenant, MailingConfig } from '@/types/super-admin';
import { toast } from 'sonner';

interface ConfigurationTabProps {
  tenant: Tenant;
}

export default function ConfigurationTab({ tenant }: ConfigurationTabProps) {
  const [mailing, setMailing] = useState<MailingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<MailingConfig>>({
    type: 'smtp',
    smtp: {
      host: '',
      port: 587,
      secure: false,
      auth: { user: '', pass: '' },
      from: ''
    }
  });

  useEffect(() => {
    fetchMailingConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.tenantId]);

  const fetchMailingConfig = async () => {
    try {
      setLoading(true);
      const response = await getTenantMailing(tenant.tenantId);
      if (response.success && response.data) {
        setMailing(response.data);
      }
    } catch {
      // Mailing config might not exist, which is fine
      setMailing(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.type) return;

    try {
      setSaving(true);
      let response;
      
      if (mailing) {
        // Update existing
        response = await updateTenantMailing(tenant.tenantId, formData as MailingConfig);
        if (response.success) {
          toast.success('Mailing configuration updated successfully');
        }
      } else {
        // Create new
        response = await createTenantMailing(tenant.tenantId, formData as MailingConfig);
        if (response.success) {
          toast.success('Mailing configuration created successfully');
        }
      }

      if (response.success) {
        await fetchMailingConfig();
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error saving mailing config:', error);
      toast.error('Failed to save mailing configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      const response = await deleteTenantMailing(tenant.tenantId);
      if (response.success) {
        setMailing(null);
        toast.success('Mailing configuration deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting mailing config:', error);
      toast.error('Failed to delete mailing configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: string, value: string | number | boolean) => {
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value as 'smtp' | 'api',
        smtp: value === 'smtp' ? { host: '', port: 587, secure: false, auth: { user: '', pass: '' }, from: '' } : undefined,
        api: value === 'api' ? { service: 'sendgrid', apiKey: '', from: '', domain: '' } : undefined
      }));
    } else if (field.startsWith('smtp.')) {
      const smtpField = field.split('.')[1];
      if (smtpField === 'auth') {
        const authField = field.split('.')[2];
        setFormData(prev => ({
          ...prev,
          smtp: {
            ...prev.smtp!,
            auth: {
              ...prev.smtp!.auth!,
              [authField]: value as string
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          smtp: {
            ...prev.smtp!,
            [smtpField]: value
          }
        }));
      }
    } else if (field.startsWith('api.')) {
      const apiField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        api: {
          ...prev.api!,
          [apiField]: value as string
        }
      }));
    }
  };

  const startEdit = () => {
    if (mailing) {
      setFormData({
        ...mailing,
        smtp: mailing.smtp ? { ...mailing.smtp, auth: { ...mailing.smtp.auth } } : undefined,
        api: mailing.api ? { ...mailing.api } : undefined
      });
    }
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Features & Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Enabled Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(tenant.features || []).map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                </div>
              ))}
              {(!tenant.features || tenant.features.length === 0) && (
                <span className="text-sm text-muted-foreground">No features enabled</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Active Modules</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(tenant.modules || []).map((module) => (
                <div key={module} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm capitalize">{module.replace('_', ' ')}</span>
                </div>
              ))}
              {(!tenant.modules || tenant.modules.length === 0) && (
                <span className="text-sm text-muted-foreground">No modules active</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Email Configuration
          </CardTitle>
          <div className="flex gap-2">
            {mailing && !showForm && (
              <>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} disabled={saving}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {!mailing && !showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Configure Email
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Configuration Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="api">API Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'smtp' && (
                <div className="space-y-4">
                  <h4 className="font-medium">SMTP Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp.host">Host</Label>
                      <Input
                        id="smtp.host"
                        value={formData.smtp?.host || ''}
                        onChange={(e) => handleFormChange('smtp.host', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp.port">Port</Label>
                      <Input
                        id="smtp.port"
                        type="number"
                        value={formData.smtp?.port || 587}
                        onChange={(e) => handleFormChange('smtp.port', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp.from">From Email</Label>
                      <Input
                        id="smtp.from"
                        value={formData.smtp?.from || ''}
                        onChange={(e) => handleFormChange('smtp.from', e.target.value)}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtp.secure"
                        checked={formData.smtp?.secure || false}
                        onCheckedChange={(checked) => handleFormChange('smtp.secure', checked)}
                      />
                      <Label htmlFor="smtp.secure">Use SSL/TLS</Label>
                    </div>
                    <div>
                      <Label htmlFor="smtp.auth.user">Username</Label>
                      <Input
                        id="smtp.auth.user"
                        value={formData.smtp?.auth?.user || ''}
                        onChange={(e) => handleFormChange('smtp.auth.user', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp.auth.pass">Password</Label>
                      <Input
                        id="smtp.auth.pass"
                        type="password"
                        value={formData.smtp?.auth?.pass || ''}
                        onChange={(e) => handleFormChange('smtp.auth.pass', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'api' && (
                <div className="space-y-4">
                  <h4 className="font-medium">API Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api.service">Service</Label>
                      <Select value={formData.api?.service} onValueChange={(value) => handleFormChange('api.service', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="ses">Amazon SES</SelectItem>
                          <SelectItem value="postmark">Postmark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="api.from">From Email</Label>
                      <Input
                        id="api.from"
                        value={formData.api?.from || ''}
                        onChange={(e) => handleFormChange('api.from', e.target.value)}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api.apiKey">API Key</Label>
                      <Input
                        id="api.apiKey"
                        type="password"
                        value={formData.api?.apiKey || ''}
                        onChange={(e) => handleFormChange('api.apiKey', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="api.domain">Domain (optional)</Label>
                      <Input
                        id="api.domain"
                        value={formData.api?.domain || ''}
                        onChange={(e) => handleFormChange('api.domain', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateOrUpdate} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mailing ? 'Update' : 'Create'} Configuration
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : mailing ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Configuration Type</h4>
                <span className="text-sm capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {mailing.type}
                </span>
              </div>

              {mailing.type === 'smtp' && mailing.smtp && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">SMTP Settings</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Host:</span> {mailing.smtp.host}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Port:</span> {mailing.smtp.port}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Secure:</span> {mailing.smtp.secure ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">From:</span> {mailing.smtp.from}
                    </div>
                  </div>
                </div>
              )}

              {mailing.type === 'api' && mailing.api && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">API Settings</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Service:</span> {mailing.api.service}
                    </div>
                    <div>
                      <span className="text-muted-foreground">From:</span> {mailing.api.from}
                    </div>
                    {mailing.api.domain && (
                      <div>
                        <span className="text-muted-foreground">Domain:</span> {mailing.api.domain}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No email configuration set up</p>
              <p className="text-xs text-muted-foreground mt-1">Configure SMTP or API-based email sending</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
