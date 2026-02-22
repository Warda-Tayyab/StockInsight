import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { availableFeaturesForPlan } from '@/lib/constants/options';

const defaultForm = {
  name: '',
  code: '',
  description: '',
  pricePerUser: 9,
  interval: 'month',
  billingModel: 'per_user',
  usersMax: 10,
  storagePerUserGB: 5,
  apiCallsPerMonth: 1000,
  selectedFeatures: []
};

export function PlanForm({ initialData, onSubmit, onCancel, loading = false, isEdit = false }) {
  const [form, setForm] = useState(initialData ? {
    ...defaultForm,
    name: initialData.name || '',
    code: initialData.code || '',
    description: initialData.description || '',
    pricePerUser: initialData.pricePerUser ?? 9,
    interval: initialData.interval || 'month',
    billingModel: initialData.billingModel || 'per_user',
    usersMax: initialData.quotas?.usersMax ?? 10,
    storagePerUserGB: initialData.quotas?.storagePerUserGB ?? 5,
    apiCallsPerMonth: initialData.quotas?.apiCallsPerMonth ?? 1000,
    selectedFeatures: (initialData.features || []).map((f) => f._id || f.key)
  } : defaultForm);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFeatureToggle = (id, checked) => {
    setForm((prev) => ({
      ...prev,
      selectedFeatures: checked ? [...prev.selectedFeatures, id] : prev.selectedFeatures.filter((f) => f !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      code: form.code || form.name.toLowerCase().replace(/\s+/g, '_') + '_' + form.interval,
      description: form.description,
      pricePerUser: Number(form.pricePerUser) || 0,
      interval: form.interval,
      billingModel: form.billingModel,
      features: form.selectedFeatures.map((id) => {
        const f = availableFeaturesForPlan.find((x) => x.id === id);
        return { _id: id, key: f ? f.label : id, isAdd: true };
      }),
      quotas: {
        usersMax: Number(form.usersMax) || 1,
        storagePerUserGB: Number(form.storagePerUserGB) || 1,
        apiCallsPerMonth: Number(form.apiCallsPerMonth) || 1
      }
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Plan Name *</Label>
          <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Starter" required />
        </div>
        <div>
          <Label>Price per user ($)</Label>
          <Input type="number" min="0" step="0.01" value={form.pricePerUser} onChange={(e) => handleChange('pricePerUser', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Brief description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Interval</Label>
          <Select value={form.interval} onValueChange={(v) => handleChange('interval', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Billing Model</Label>
          <Select value={form.billingModel} onValueChange={(v) => handleChange('billingModel', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="per_user">Per User</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>User Limit</Label>
          <Input type="number" min="0" value={form.usersMax} onChange={(e) => handleChange('usersMax', e.target.value)} />
        </div>
        <div>
          <Label>Storage (GB)</Label>
          <Input type="number" min="0" value={form.storagePerUserGB} onChange={(e) => handleChange('storagePerUserGB', e.target.value)} />
        </div>
        <div>
          <Label>API calls/mo</Label>
          <Input type="number" min="0" value={form.apiCallsPerMonth} onChange={(e) => handleChange('apiCallsPerMonth', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Features</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
          {availableFeaturesForPlan.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <Checkbox
                id={f.id}
                checked={form.selectedFeatures.includes(f.id)}
                onCheckedChange={(c) => handleFeatureToggle(f.id, c === true)}
              />
              <Label htmlFor={f.id} className="text-sm font-normal">{f.label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
