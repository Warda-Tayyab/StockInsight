"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save, RefreshCw, Mail, Shield, Globe, Bell, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SystemSettingsPage() {
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleInputChange = () => {
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    // Simulate save action
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>System Settings</h2>
          <p className="text-muted-foreground">Configure global system settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don&apos;t forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input 
                    id="app-name" 
                    defaultValue="SaaS Platform" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="app-description">Description</Label>
                  <Textarea 
                    id="app-description" 
                    defaultValue="Multi-tenant SaaS platform for enterprise solutions"
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="app-url">Primary URL</Label>
                  <Input 
                    id="app-url" 
                    defaultValue="https://platform.example.com" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select onValueChange={() => handleInputChange()}>
                    <SelectTrigger>
                      <SelectValue placeholder="UTC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="pst">Pacific (PST)</SelectItem>
                      <SelectItem value="est">Eastern (EST)</SelectItem>
                      <SelectItem value="cet">Central European (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select onValueChange={() => handleInputChange()}>
                    <SelectTrigger>
                      <SelectValue placeholder="English" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Feature Toggles */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="user-registration">User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
                  </div>
                  <Switch id="user-registration" defaultChecked onChange={handleInputChange} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tenant-creation">Tenant Self-Service</Label>
                    <p className="text-sm text-muted-foreground">Allow users to create their own tenants</p>
                  </div>
                  <Switch id="tenant-creation" defaultChecked onChange={handleInputChange} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">Enable usage analytics and tracking</p>
                  </div>
                  <Switch id="analytics" defaultChecked onChange={handleInputChange} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable maintenance mode for updates</p>
                  </div>
                  <Switch id="maintenance" onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Limits and Quotas */}
          <Card>
            <CardHeader>
              <CardTitle>System Limits & Quotas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max-tenants">Max Tenants</Label>
                  <Input 
                    id="max-tenants" 
                    type="number" 
                    defaultValue="1000" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="max-users-per-tenant">Max Users per Tenant</Label>
                  <Input 
                    id="max-users-per-tenant" 
                    type="number" 
                    defaultValue="10000" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="max-storage">Max Storage per Tenant (GB)</Label>
                  <Input 
                    id="max-storage" 
                    type="number" 
                    defaultValue="1000" 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mfa-required">Require MFA</Label>
                    <p className="text-sm text-muted-foreground">Enforce multi-factor authentication</p>
                  </div>
                  <Switch id="mfa-required" onChange={handleInputChange} />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input 
                    id="session-timeout" 
                    type="number" 
                    defaultValue="60" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <Select onValueChange={() => handleInputChange()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (8 characters)</SelectItem>
                      <SelectItem value="standard">Standard (8 chars + special)</SelectItem>
                      <SelectItem value="strict">Strict (12 chars + mixed case)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sso-enabled">SSO Integration</Label>
                    <p className="text-sm text-muted-foreground">Enable SAML/OAuth SSO</p>
                  </div>
                  <Switch id="sso-enabled" defaultChecked onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            {/* Security Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audit-logging">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all administrative actions</p>
                  </div>
                  <Switch id="audit-logging" defaultChecked onChange={handleInputChange} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="failed-login-monitoring">Failed Login Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Monitor and block suspicious logins</p>
                  </div>
                  <Switch id="failed-login-monitoring" defaultChecked onChange={handleInputChange} />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input 
                    id="max-login-attempts" 
                    type="number" 
                    defaultValue="5" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                  <Input 
                    id="lockout-duration" 
                    type="number" 
                    defaultValue="15" 
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input 
                    id="smtp-host" 
                    defaultValue="smtp.example.com" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input 
                    id="smtp-port" 
                    type="number" 
                    defaultValue="587" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input 
                    id="smtp-username" 
                    defaultValue="noreply@example.com" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input 
                    id="smtp-password" 
                    type="password" 
                    placeholder="••••••••" 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smtp-tls">Enable TLS/SSL</Label>
                  <p className="text-sm text-muted-foreground">Use encrypted connection</p>
                </div>
                <Switch id="smtp-tls" defaultChecked onChange={handleInputChange} />
              </div>
              <Separator />
              <div>
                <Label htmlFor="from-address">Default From Address</Label>
                <Input 
                  id="from-address" 
                  defaultValue="noreply@platform.example.com" 
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="from-name">Default From Name</Label>
                <Input 
                  id="from-name" 
                  defaultValue="SaaS Platform" 
                  onChange={handleInputChange}
                />
              </div>
              <div className="pt-4">
                <Button variant="outline">Test Email Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-tenant-notifications">New Tenant Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify admins when new tenants register</p>
                </div>
                <Switch id="new-tenant-notifications" defaultChecked onChange={handleInputChange} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="billing-notifications">Billing Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify about payment failures and renewals</p>
                </div>
                <Switch id="billing-notifications" defaultChecked onChange={handleInputChange} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="security-notifications">Security Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify about security events and breaches</p>
                </div>
                <Switch id="security-notifications" defaultChecked onChange={handleInputChange} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-notifications">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify about system updates and maintenance</p>
                </div>
                <Switch id="system-notifications" defaultChecked onChange={handleInputChange} />
              </div>
              <Separator />
              <div>
                <Label htmlFor="notification-email">Admin Notification Email</Label>
                <Input 
                  id="notification-email" 
                  type="email" 
                  defaultValue="admin@example.com" 
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="api-enabled">API Access</Label>
                    <p className="text-sm text-muted-foreground">Enable REST API access</p>
                  </div>
                  <Switch id="api-enabled" defaultChecked onChange={handleInputChange} />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="api-rate-limit">Rate Limit (requests/min)</Label>
                  <Input 
                    id="api-rate-limit" 
                    type="number" 
                    defaultValue="1000" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="api-version">Default API Version</Label>
                  <Select onValueChange={() => handleInputChange()}>
                    <SelectTrigger>
                      <SelectValue placeholder="v1" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">Version 1.0</SelectItem>
                      <SelectItem value="v2">Version 2.0 (Beta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="api-docs">Public API Documentation</Label>
                    <p className="text-sm text-muted-foreground">Make API docs publicly accessible</p>
                  </div>
                  <Switch id="api-docs" defaultChecked onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="webhooks-enabled">Enable Webhooks</Label>
                    <p className="text-sm text-muted-foreground">Allow outbound webhook notifications</p>
                  </div>
                  <Switch id="webhooks-enabled" onChange={handleInputChange} />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="webhook-timeout">Webhook Timeout (seconds)</Label>
                  <Input 
                    id="webhook-timeout" 
                    type="number" 
                    defaultValue="30" 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-retry-attempts">Max Retry Attempts</Label>
                  <Input 
                    id="webhook-retry-attempts" 
                    type="number" 
                    defaultValue="3" 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="webhook-signature">Webhook Signatures</Label>
                    <p className="text-sm text-muted-foreground">Sign webhook payloads with HMAC</p>
                  </div>
                  <Switch id="webhook-signature" defaultChecked onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Keys Management */}
          <Card>
            <CardHeader>
              <CardTitle>System API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div>Master API Key</div>
                    <div className="text-sm text-muted-foreground">Full system access</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button variant="outline" size="sm">Regenerate</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div>Webhook Signing Key</div>
                    <div className="text-sm text-muted-foreground">For webhook payload signing</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button variant="outline" size="sm">Regenerate</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
