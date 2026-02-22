import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const REGIONS = [
  { value: 'us-east-1', label: 'US East' },
  { value: 'us-west-2', label: 'US West' },
  { value: 'eu-west-1', label: 'Europe' },
  { value: 'ap-southeast-1', label: 'Asia Pacific' }
];

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' }
];

const defaultForm = {
  companyName: '',
  slug: '',
  status: 'trial',
  region: 'us-east-1',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  seats: 50,
  storageGB: 10,
  ordersPerMonth: 5000
};

/**
 * Create Tenant form - Jab API banaogi to onSubmit mein api call replace karna
 */
export function CreateTenantForm({ onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.companyName?.trim()) e.companyName = 'Company name required';
    if (!form.slug?.trim()) e.slug = 'Subdomain required';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Only lowercase, numbers, hyphen';
    if (!form.contactEmail?.trim()) e.contactEmail = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix errors');
      return;
    }
    const payload = {
      companyName: form.companyName.trim(),
      slug: form.slug.trim().toLowerCase(),
      status: form.status,
      region: form.region,
      primaryContact: {
        name: form.contactName.trim(),
        email: form.contactEmail.trim(),
        phone: form.contactPhone?.trim() || undefined
      },
      quotas: { seats: Number(form.seats) || 50, storageGB: Number(form.storageGB) || 10, ordersPerMonth: Number(form.ordersPerMonth) || 5000 }
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>New Tenant</CardTitle>
          <p className="text-sm text-muted-foreground">Jab API lagao gi to yahi payload backend ko bhejna</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Acme Corp"
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
            </div>
            <div>
              <Label htmlFor="slug">Subdomain *</Label>
              <div className="flex">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))}
                  placeholder="acme"
                  className={errors.slug ? 'border-destructive rounded-r-none' : 'rounded-r-none'}
                />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-sm text-muted-foreground">.tickflo.com</span>
              </div>
              {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={form.region} onValueChange={(v) => handleChange('region', v)}>
                <SelectTrigger id="region"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Primary Contact</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contactName">Name</Label>
                <Input id="contactName" value={form.contactName} onChange={(e) => handleChange('contactName', e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="john@company.com"
                  className={errors.contactEmail ? 'border-destructive' : ''}
                />
                {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail}</p>}
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone</Label>
                <Input id="contactPhone" value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} placeholder="+1 555-0100" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Quotas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input id="seats" type="number" min="1" value={form.seats} onChange={(e) => handleChange('seats', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="storageGB">Storage (GB)</Label>
                <Input id="storageGB" type="number" min="1" value={form.storageGB} onChange={(e) => handleChange('storageGB', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ordersPerMonth">Orders / month</Label>
                <Input id="ordersPerMonth" type="number" min="0" value={form.ordersPerMonth} onChange={(e) => handleChange('ordersPerMonth', e.target.value)} placeholder="5000" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Tenant'}</Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
