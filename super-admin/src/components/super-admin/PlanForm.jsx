import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const defaultForm = {
  name: '',
  displayName: '',
  price: 0,
  description: '',
  features: '',
  color: '#0ea5e9',
  isActive: true,
  sortOrder: 0
}

function PlanForm({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        displayName: initialData.displayName || '',
        price: initialData.price ?? 0,
        description: initialData.description || '',
        features: (initialData.features || []).join('\n'),
        color: initialData.color || '#0ea5e9',
        isActive: initialData.isActive !== false,
        sortOrder: initialData.sortOrder ?? 0
      })
    } else if (isOpen) {
      setForm(defaultForm)
      setErrors({})
    }
  }, [isOpen, initialData])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const next = {}
    if (!initialData && !form.name.trim()) {
      next.name = 'Plan slug is required (e.g. free, basic, pro).'
    } else if (!initialData && !/^[a-z0-9-]+$/.test(form.name.trim())) {
      next.name = 'Slug can only contain lowercase letters, numbers, and hyphens.'
    }
    if (!form.displayName.trim()) next.displayName = 'Display name is required.'
    if (form.price === '' || Number(form.price) < 0) next.price = 'Price must be 0 or greater.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        features: form.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        color: form.color,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0
      }

      await onSubmit?.(payload)
    } catch (err) {
      console.error(err)
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialData ? 'Edit Plan' : 'Create Plan'}
          </h2>
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
          {errors.form && (
            <p className="text-sm text-red-600 text-center">{errors.form}</p>
          )}

          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plan Slug *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value.toLowerCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. free, basic, pro"
              />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Used internally when assigning plans to tenants.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Free, Basic, Pro"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monthly Price (USD) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of this plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Features (one per line)
            </label>
            <textarea
              value={form.features}
              onChange={(e) => handleChange('features', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={'Up to 50 products\n1 warehouse\nBasic reports'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full h-10 px-1 py-1 border border-slate-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4"
            />
            Active (visible in tenant plan dropdown)
          </label>

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
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlanForm
