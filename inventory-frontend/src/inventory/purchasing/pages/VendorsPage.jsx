/** @module inventory/purchasing/pages/VendorsPage */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';

const emptyForm = {
  name: '',
  code: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
  status: 'active',
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const load = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.listVendors({ search: search || undefined });
      setVendors(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowForm(true);
  };
  
  const openEdit = (v) => {
    setEditing(v);
    setErrors({});
    setForm({
      name: v.name || '',
      code: v.code || '',
      contactPerson: v.contactPerson || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      city: v.city || '',
      notes: v.notes || '',
      status: v.status || 'active',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
  
    const name = form.name.trim();
    const code = form.code.trim();
    const contactPerson = form.contactPerson.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const city = form.city.trim();
    const address = form.address.trim();
  
    const newErrors = {};
  
    // Supplier Name
    if (!name) {
      newErrors.name = 'Supplier name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Supplier name must be at least 2 characters';
    } else if (name.length > 50) {
      newErrors.name = 'Supplier name cannot exceed 50 characters';
    }
  
    // Supplier Code
    if (code) {
      if (code.length < 2) {
        newErrors.code = 'Supplier code must be at least 2 characters';
      } else if (code.length > 30) {
        newErrors.code = 'Supplier code cannot exceed 30 characters';
      } else if (!/^[A-Za-z0-9-_]+$/.test(code)) {
        newErrors.code =
          'Only letters, numbers, hyphens and underscores are allowed';
      }
    }
  
    // Contact Person
    if (contactPerson) {
      if (contactPerson.length < 2) {
        newErrors.contactPerson =
          'Contact person must be at least 2 characters';
      } else if (!/^[A-Za-z\s.'-]+$/.test(contactPerson)) {
        newErrors.contactPerson =
          'Contact person can only contain letters and spaces';
      }
    }
  
    // Phone
    if (phone && !/^03\d{9}$/.test(phone)) {
      newErrors.phone =
        'Enter a valid Pakistani phone number (e.g. 03001234567)';
    }
  
    // Email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
      if (!emailRegex.test(email)) {
        newErrors.email = 'Enter a valid email address';
      }
    }
  
    // City
    if (city) {
      if (city.length < 2) {
        newErrors.city = 'City must be at least 2 characters';
      } else if (!/^[A-Za-z\s.'-]+$/.test(city)) {
        newErrors.city = 'City can only contain letters and spaces';
      }
    }
  
    // Address
    if (address && address.length < 5) {
      newErrors.address = 'Address must be at least 5 characters';
    }
  
    // Status
    if (!['active', 'inactive'].includes(form.status)) {
      newErrors.status = 'Invalid supplier status';
    }
  
    // Show all errors
    setErrors(newErrors);
  
    // Don't submit if errors exist
    if (Object.keys(newErrors).length > 0) {
      return;
    }
  
    setSaving(true);
  
    try {
      const validatedForm = {
        ...form,
        name,
        code,
        contactPerson,
        phone,
        email,
        city,
        address,
        notes: form.notes.trim(),
      };
  
      if (editing) {
        await purchaseService.updateVendor(editing._id, validatedForm);
        toast.success('Supplier updated');
      } else {
        await purchaseService.createVendor(validatedForm);
        toast.success('Supplier created');
      }
  
      setShowForm(false);
      setForm(emptyForm);
      setErrors({});
      setEditing(null);
  
      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Suppliers for purchasing goods and materials</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
          <HiOutlinePlus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="card-padded flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Search suppliers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <button type="button" className="btn-secondary" onClick={load}>
          Search
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card-padded grid grid-cols-1 md:grid-cols-2 gap-3">
          <h2 className="md:col-span-2 text-base font-semibold m-0">
            {editing ? 'Edit Supplier' : 'New Supplier'}
          </h2>
          {[
  ['name', 'Supplier Name *'],
  ['code', 'Supplier Code (optional)'],
  ['contactPerson', 'Contact person'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['city', 'City'],
].map(([key, label]) => (
  <div key={key}>
    <label className="form-label">{label}</label>

    <input
      
        type={key === 'phone' ? 'tel' : 'text'}
        inputMode={key === 'email' ? 'email' : key === 'phone' ? 'tel' : undefined}
      className={`input-field ${
        errors[key] ? 'border-red-500 focus:border-red-500' : ''
      }`}
      value={form[key]}
      onChange={(e) => {
        setForm({
          ...form,
          [key]: e.target.value,
        });

        // Error remove as user fixes field
        if (errors[key]) {
          setErrors({
            ...errors,
            [key]: '',
          });
        }
      }}
      maxLength={
        key === 'name'
          ? 50
          : key === 'code'
          ? 30
          : key === 'email'
          ? 150
          : key === 'phone'
          ? 11
          : 100
      }
    />

    {errors[key] && (
      <p className="mt-1 text-xs text-red-600">
        {errors[key]}
      </p>
    )}
  </div>
))}
          <div className="md:col-span-2">
  <label className="form-label">Address</label>

  <input
    className={`input-field ${
      errors.address
        ? 'border-red-500 focus:border-red-500'
        : ''
    }`}
    value={form.address}
    onChange={(e) => {
      setForm({
        ...form,
        address: e.target.value,
      });

      if (errors.address) {
        setErrors({
          ...errors,
          address: '',
        });
      }
    }}
  />

  {errors.address && (
    <p className="mt-1 text-xs text-red-600">
      {errors.address}
    </p>
  )}
</div>
<div>
  <label className="form-label">Status</label>

  <select
    className={`select-field ${
      errors.status
        ? 'border-red-500 focus:border-red-500'
        : ''
    }`}
    value={form.status}
    onChange={(e) => {
      setForm({
        ...form,
        status: e.target.value,
      });

      if (errors.status) {
        setErrors({
          ...errors,
          status: '',
        });
      }
    }}
  >
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>

  {errors.status && (
    <p className="mt-1 text-xs text-red-600">
      {errors.status}
    </p>
  )}
</div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Code</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    Loading…
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    No suppliers yet.{' '}
                    <button type="button" className="text-indigo-600 underline" onClick={openCreate}>
                      Add one
                    </button>
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v._id}>
                    <td className="font-medium">{v.name}</td>
                    <td>{v.code || '—'}</td>
                    <td>{v.phone || '—'}</td>
                    <td>{v.city || '—'}</td>
                    <td>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          v.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-sm text-indigo-600 hover:underline"
                        onClick={() => openEdit(v)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500">
      Tip: For purchasing management, select suppliers from this section.
      </p>
    </div>
  );
};

export default VendorsPage;
