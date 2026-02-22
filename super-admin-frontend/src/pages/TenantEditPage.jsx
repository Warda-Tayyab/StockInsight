import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, X, AlertTriangle, Building2, Shield, Settings, Users, AlertCircle } from 'lucide-react';
import { useTenant, useTenantActions } from '@/hooks/use-super-admin';
import { toast } from 'sonner';

const AVAILABLE_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' }
];
const TIMEZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

export default function TenantEditPage() {
  const navigate = useNavigate();
  const { id: tenantId } = useParams();
  const { tenant, loading, error: fetchError, refetch } = useTenant(tenantId);
  const { updateTenant, loading: updating } = useTenantActions();

  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData({
        companyName: tenant.companyName || '',
        slug: tenant.slug || '',
        status: tenant.status || 'trial',
        region: tenant.region || '',
        primaryContact: {
          name: tenant.primaryContact?.name || '',
          email: tenant.primaryContact?.email || '',
          phone: tenant.primaryContact?.phone || '',
          timezone: tenant.primaryContact?.timezone || 'UTC'
        },
        trial: { days: tenant.trial?.days || 14 },
        security: {
          mfaRequired: tenant.security?.mfaRequired || false,
          ssoEnabled: tenant.security?.ssoEnabled || false,
          auditEnabled: tenant.security?.auditEnabled !== false
        },
        quotas: {
          seats: tenant.quotas?.seats || 50,
          storageGB: tenant.quotas?.storageGB || 10,
          ordersPerMonth: tenant.quotas?.ordersPerMonth || 5000,
          apiRps: tenant.quotas?.apiRps || 100
        }
      });
    }
  }, [tenant]);

  const handleBack = () => navigate(`/tenant-management/${tenantId}`);

  const handleInputChange = (field, value) => {
    const keys = field.split('.');
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updateTenant(tenantId, formData);
    if (success) {
      toast.success('Tenant updated successfully');
      setHasChanges(false);
      refetch();
      navigate(`/tenant-management/${tenantId}`);
    } else {
      toast.error('Failed to update tenant');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="w-4 h-4" /></Button>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (fetchError || !tenant) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{fetchError || 'Tenant not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3"><Building2 className="w-6 h-6" />Edit Tenant</h2>
            <p className="text-muted-foreground">Update tenant configuration and settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && <span className="text-sm text-orange-600">Unsaved changes</span>}
          <Button variant="outline" onClick={handleBack} disabled={updating}>Cancel</Button>
          <Button onClick={handleSave} disabled={updating || !hasChanges}><Save className="w-4 h-4 mr-2" />{updating ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="quotas">Quotas & Limits</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={formData.companyName || ''} onChange={(e) => handleInputChange('companyName', e.target.value)} placeholder="Enter company name" />
              </div>
              <div>
                <Label htmlFor="slug">Subdomain</Label>
                <Input id="slug" value={formData.slug || ''} onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())} placeholder="company-name" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'trial'} onValueChange={(v) => handleInputChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={formData.region || ''} onValueChange={(v) => handleInputChange('region', v)}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_REGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Primary Contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" value={formData.primaryContact?.name || ''} onChange={(e) => handleInputChange('primaryContact.name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input id="contactEmail" type="email" value={formData.primaryContact?.email || ''} onChange={(e) => handleInputChange('primaryContact.email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone</Label>
                <Input id="contactPhone" value={formData.primaryContact?.phone || ''} onChange={(e) => handleInputChange('primaryContact.phone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.primaryContact?.timezone || 'UTC'} onValueChange={(v) => handleInputChange('primaryContact.timezone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quotas" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Resource Quotas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seats">User Seats</Label>
                <Input id="seats" type="number" min="1" value={formData.quotas?.seats || 50} onChange={(e) => handleInputChange('quotas.seats', parseInt(e.target.value) || 50)} />
              </div>
              <div>
                <Label htmlFor="storageGB">Storage (GB)</Label>
                <Input id="storageGB" type="number" min="1" value={formData.quotas?.storageGB || 10} onChange={(e) => handleInputChange('quotas.storageGB', parseInt(e.target.value) || 10)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
