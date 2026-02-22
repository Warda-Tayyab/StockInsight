import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { statusOptions, regionOptions, businessVerticalOptions, useCaseOptions } from '../../data/dummyData'

function TenantForm({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState({
    tenantName: '',
    slug: '',
    ownerEmail: '',
    status: 'Trial',
    region: '',
    businessVertical: '',
    useCase: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setForm({
        tenantName: initialData.companyName || '',
        slug: initialData.slug || '',
        ownerEmail: initialData.ownerEmail || '',
        status: initialData.status || 'Trial',
        region: initialData.region || '',
        businessVertical: initialData.businessVertical || '',
        useCase: initialData.useCase || '',
      })
    } else if (isOpen) {
      setForm({
        tenantName: '',
        slug: '',
        ownerEmail: '',
        status: 'Trial',
        region: '',
        businessVertical: '',
        useCase: '',
      })
      setErrors({})
    }
  }, [isOpen, initialData])

  const generateSlug = (name) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'tenantName') {
      setForm((prev) => ({ ...prev, slug: generateSlug(value) }))
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const next = {}
    if (!form.tenantName.trim()) next.tenantName = 'Tenant name is required.'
    if (!form.ownerEmail.trim()) next.ownerEmail = 'Owner email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) {
      next.ownerEmail = 'Enter a valid email address.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit?.(form)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-900">Create Tenant</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tenant Name *</label>
            <input
              type="text"
              value={form.tenantName}
              onChange={(e) => handleChange('tenantName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Acme Corp"
            />
            {errors.tenantName && <p className="mt-1 text-sm text-red-600">{errors.tenantName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="acme-corp"
            />
            <p className="mt-1 text-xs text-slate-500">Auto-generated from name (lowercase)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Owner Email *</label>
            <input
              type="email"
              value={form.ownerEmail}
              onChange={(e) => handleChange('ownerEmail', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="admin@company.com"
            />
            {errors.ownerEmail && <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select region</option>
              {regionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Vertical</label>
            <select
              value={form.businessVertical}
              onChange={(e) => handleChange('businessVertical', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select vertical</option>
              {businessVerticalOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Use Case</label>
            <select
              value={form.useCase}
              onChange={(e) => handleChange('useCase', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select use case</option>
              {useCaseOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TenantForm
