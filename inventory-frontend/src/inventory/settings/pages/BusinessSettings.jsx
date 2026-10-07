/** @module inventory/settings/pages/BusinessSettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import settingsService from '../../../shared/services/settingsService';

const empty = {
  name: '',
  slug: '',
  primaryContact: {
    name: '',
    email: '',
    phone: '',
    timezone: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
  },
};

const BusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    settingsService.getBusiness()
      .then((res) => {
        const d = res.data.data;
        setForm({
          name: d.name || '',
          slug: d.slug || '',
          primaryContact: {
            name: d.primaryContact?.name || '',
            email: d.primaryContact?.email || '',
            phone: d.primaryContact?.phone || '',
            timezone: d.primaryContact?.timezone || '',
            address: {
              street: d.primaryContact?.address?.street || '',
              city: d.primaryContact?.address?.city || '',
              state: d.primaryContact?.address?.state || '',
              zipCode: d.primaryContact?.address?.zipCode || '',
              country: d.primaryContact?.address?.country || '',
            },
          },
        });
      })
      .catch(() => toast.error('Failed to load store info'))
      .finally(() => setLoading(false));
  }, []);

  const setContact = (field, value) => {
    setForm((f) => ({
      ...f,
      primaryContact: { ...f.primaryContact, [field]: value },
    }));
  };

  const setAddress = (field, value) => {
    setForm((f) => ({
      ...f,
      primaryContact: {
        ...f.primaryContact,
        address: { ...f.primaryContact.address, [field]: value },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateBusiness({
        name: form.name,
        primaryContact: form.primaryContact,
      });
      toast.success('Store info saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading…</div>;

  return (
    <form onSubmit={handleSave} className="card-padded grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <h2 className="text-lg font-semibold text-slate-900">Business / Store Info</h2>
        <p className="text-sm text-slate-500">Shown on receipts and team invites</p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Store name</label>
        <input className="input-field" required value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Company slug</label>
        <input className="input-field bg-slate-50" value={form.slug} disabled />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Contact name</label>
        <input className="input-field" value={form.primaryContact.name}
          onChange={(e) => setContact('name', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Contact phone</label>
        <input className="input-field" value={form.primaryContact.phone}
          onChange={(e) => setContact('phone', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Contact email</label>
        <input type="email" className="input-field" value={form.primaryContact.email}
          onChange={(e) => setContact('email', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Timezone</label>
        <input className="input-field" placeholder="e.g. Asia/Karachi" value={form.primaryContact.timezone}
          onChange={(e) => setContact('timezone', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold mb-2">Street</label>
        <input className="input-field" value={form.primaryContact.address.street}
          onChange={(e) => setAddress('street', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">City</label>
        <input className="input-field" value={form.primaryContact.address.city}
          onChange={(e) => setAddress('city', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">State</label>
        <input className="input-field" value={form.primaryContact.address.state}
          onChange={(e) => setAddress('state', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Zip code</label>
        <input className="input-field" value={form.primaryContact.address.zipCode}
          onChange={(e) => setAddress('zipCode', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Country</label>
        <input className="input-field" value={form.primaryContact.address.country}
          onChange={(e) => setAddress('country', e.target.value)} />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Store Info'}
        </button>
      </div>
    </form>
  );
};

export default BusinessSettings;
