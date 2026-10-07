import { useState, useEffect } from 'react'
import api from '../../utils/api'
import {
  statusOptions,
  regionOptions,
  businessVerticalOptions,
  useCaseOptions
} from '../../data/dummyData'
import {
  Building2,
  User,
  Phone,
  MapPin,
  Briefcase,
  Shield
} from 'lucide-react'
function TenantForm({ isOpen, onClose, onSubmit, initialData }) {
    const [form, setForm] = useState({
      // Tenant
      tenantName: '',
      slug: '',
      status: 'trial',
      plan: '',
    
      // Owner
      ownerEmail: '',
      ownerFirstName: '',
      ownerLastName: '',
    
      // Primary Contact
      contactName: '',
      phone: '',
      timezone: '',
    
      // Address
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    
      // Business
      businessVertical: '',
      useCase: '',
    
      // Account
      password: '',
      setPasswordNow: false
    })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true)
        const res = await api.get('/api/admin/plans?activeOnly=true')
        setPlans(res.data.plans || [])
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      } finally {
        setPlansLoading(false)
      }
    }

    fetchPlans()
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      setForm({
        // Tenant
        tenantName: initialData.name || '',
        slug: initialData.slug || '',
        status: initialData.status || 'trial',
        plan: initialData.plan || '',
      
        // Owner
        ownerEmail: initialData.ownerEmail || '',
        ownerFirstName: initialData.ownerUserId?.firstName || '',
        ownerLastName: initialData.ownerUserId?.lastName || '',
      
        // Primary Contact
        contactName: initialData.primaryContact?.name || '',
        phone: initialData.primaryContact?.phone || '',
        timezone: initialData.primaryContact?.timezone || '',
      
        // Address
        street: initialData.primaryContact?.address?.street || '',
        city: initialData.primaryContact?.address?.city || '',
        state: initialData.primaryContact?.address?.state || '',
        zipCode: initialData.primaryContact?.address?.zipCode || '',
        country: initialData.primaryContact?.address?.country || '',
      
        // Business
        businessVertical: initialData.business?.verticals?.[0] || '',
        useCase: initialData.business?.useCases?.[0] || '',
      
        // Password
        password: '',
        setPasswordNow: false
      })
    } else if (isOpen) {
      setForm({
        tenantName: '',
        slug: '',
        status: 'trial',
        plan: '',
      
        ownerEmail: '',
        ownerFirstName: '',
        ownerLastName: '',
      
        contactName: '',
        phone: '',
        timezone: '',
      
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      
        businessVertical: '',
        useCase: '',
      
        password: '',
        setPasswordNow: false
      })
      setErrors({})
    }
  }, [isOpen, initialData])

  
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }))
  
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const next = {}
    if (!form.tenantName.trim()) next.tenantName = 'Tenant name is required.'
    if (!form.ownerEmail.trim()) next.ownerEmail = 'Owner email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) {
      next.ownerEmail = 'Enter a valid email address.'
    }
    if (!form.contactName.trim())
  next.contactName = 'Contact name is required.'
if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone))
  next.phone = 'Enter a valid phone number.'
    if (!form.ownerFirstName.trim()) next.ownerFirstName = 'Owner first name is required.'
      const slugError = validateSlug(form.slug)
       if (slugError) next.slug = slugError
      setErrors(next)
    return Object.keys(next).length === 0
  }
  const validateSlug = (slug) => {
    if (!slug) return 'Slug is required.'
    if (!/^[a-z0-9-]+$/.test(slug))
      return 'Slug can only contain lowercase letters, numbers, and hyphens.'
    if (slug.length < 4)
      return 'Slug must be at least 4 characters long.'
    if (slug.length > 20)
    return 'Slug cannot exceed 20 characters.'
    if (/^-|-$/.test(slug)) return 'Slug cannot start or end with a hyphen.'
    return ''
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      // Payload formatted for backend
      const payload = {
        name: form.tenantName?.trim(),
        slug: form.slug,
        ownerEmail: form.ownerEmail?.trim(),
        ownerFirstName: form.ownerFirstName.trim(),
        ownerLastName: form.ownerLastName,
        status: form.status.toLowerCase(),
        business: {
          verticals: form.businessVertical ? [form.businessVertical] : [],
          useCases: form.useCase ? [form.useCase] : []
        },
        primaryContact: {
          name: form.contactName.trim(),
          email: form.ownerEmail.trim(),
          phone: form.phone,
          timezone: form.timezone,
        
          address: {
            street: form.street,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country
          }
        },
        plan: form.plan
      };
      
      if (!initialData) {
        payload.setPasswordNow = form.setPasswordNow;
        if (form.setPasswordNow) {
          payload.password = form.password;
        }
      }
      await onSubmit?.(payload, (backendErrors) => {
        if (backendErrors && Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors)
        } else {
          onClose?.()
        }
      })
    } catch (err) {
      console.error(err)
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="w-full">
      <div className="bg-white">
      <div className="sticky top-0 flex items-center px-6 py-5 bg-white">
      <h2 className="text-3xl font-bold text-slate-900">
            {initialData ? 'Update Tenant' : 'Create Tenant'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 text-center">{errors.form}</p>
          )}

        {/* ================= Tenant Information ================= */}

<div className="border border-slate-200 rounded-xl p-5 space-y-4">
<h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <Building2 className="w-5 h-5 text-primary-600" />
    Tenant Information
</h3>

  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      Tenant Name *
    </label>

    <input
      type="text"
      value={form.tenantName}
      onChange={(e) => handleChange('tenantName', e.target.value)}
      placeholder="Acme Corporation"
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
    />

    {errors.tenantName && (
      <p className="text-red-600 text-sm mt-1">
        {errors.tenantName}
      </p>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      Slug *
    </label>

    <input
      type="text"
      value={form.slug}
      onChange={(e) => {
        const value = e.target.value.toLowerCase()
        handleChange('slug', value)
      }}
      placeholder="acme-corp"
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
    />

    {errors.slug ? (
      <p className="text-red-600 text-sm mt-1">
        {errors.slug}
      </p>
    ) : (
      <p className="text-xs text-slate-500 mt-1">
        Lowercase letters, numbers and hyphens only.
      </p>
    )}
  </div>

  <div className="grid md:grid-cols-2 gap-4">

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Status
      </label>

      <select
        value={form.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      >
        {statusOptions.map((opt) => (
          <option
            key={opt.toLowerCase()}
            value={opt.toLowerCase()}
          >
            {opt}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Plan
      </label>

      <select
        value={form.plan}
        onChange={(e) => handleChange('plan', e.target.value)}
        disabled={plansLoading}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      >
        <option value="">
          {plansLoading ? 'Loading Plans...' : 'Select Plan'}
        </option>

        {plans.map((plan) => (
          <option key={plan._id} value={plan.name}>
            {plan.displayName} — ${plan.price}/mo
          </option>
        ))}
      </select>
    </div>

  </div>
</div>

{/* ================= Owner Information ================= */}

<div className="border border-slate-200 rounded-xl p-5 space-y-4">

<h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <User className="w-5 h-5 text-primary-600" />
    Owner Information
</h3>

  <div className="grid md:grid-cols-2 gap-4">

    <div>

      <label className="block text-sm font-medium text-slate-700 mb-1">
        First Name *
      </label>

      <input
        type="text"
        value={form.ownerFirstName}
        onChange={(e) =>
          handleChange('ownerFirstName', e.target.value)
        }
        placeholder="John"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      />

      {errors.ownerFirstName && (
        <p className="text-red-600 text-sm mt-1">
          {errors.ownerFirstName}
        </p>
      )}

    </div>

    <div>

      <label className="block text-sm font-medium text-slate-700 mb-1">
        Last Name
      </label>

      <input
        type="text"
        value={form.ownerLastName}
        onChange={(e) =>
          handleChange('ownerLastName', e.target.value)
        }
        placeholder="Doe"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      />

    </div>

  </div>

  <div>

    <label className="block text-sm font-medium text-slate-700 mb-1">
      Email Address *
    </label>

    <input
      type="email"
      value={form.ownerEmail}
      onChange={(e) =>
        handleChange('ownerEmail', e.target.value)
      }
      placeholder="owner@company.com"
      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
    />

    {errors.ownerEmail && (
      <p className="text-red-600 text-sm mt-1">
        {errors.ownerEmail}
      </p>
    )}

  </div>

</div>

        {/* ================= Primary Contact ================= */}

<div className="border border-slate-200 rounded-xl p-5 space-y-4">
<h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <Phone className="w-5 h-5 text-primary-600" />
    Primary Contact
</h3>

<div className="grid md:grid-cols-2 gap-4">

<div>
<label className="block text-sm font-medium text-slate-700 mb-1">
Contact Name *
</label>

<input
type="text"
value={form.contactName}
placeholder="Enter Contact Person Name"
onChange={(e)=>handleChange("contactName",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

{errors.contactName && (
<p className="text-red-600 text-sm mt-1">
{errors.contactName}
</p>
)}

</div>

<div>
<label className="block text-sm font-medium text-slate-700 mb-1">
Phone Number
</label>

<input
type="text"
value={form.phone}
onChange={(e)=>handleChange("phone",e.target.value)}
placeholder="+92 3001234567"
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

{errors.phone && (
<p className="text-red-600 text-sm mt-1">
{errors.phone}
</p>
)}

</div>

</div>

<div>

<label className="block text-sm font-medium text-slate-700 mb-1">
Timezone
</label>

<select
value={form.timezone}
onChange={(e)=>handleChange("timezone",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
>

<option value="">Select timezone</option>

{regionOptions.map((item)=>(
<option
key={item}
value={item}
>
{item}
</option>
))}

</select>

</div>

</div>

{/* ================= Business Address ================= */}

<div className="border border-slate-200 rounded-xl p-5 space-y-4">

<h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <MapPin className="w-5 h-5 text-primary-600" />
    Business Address
</h3>

<input
type="text"
placeholder="Street Address"
value={form.street}
onChange={(e)=>handleChange("street",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

<div className="grid md:grid-cols-2 gap-4">

<input
type="text"
placeholder="City"
value={form.city}
onChange={(e)=>handleChange("city",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

<input
type="text"
placeholder="State / Province"
value={form.state}
onChange={(e)=>handleChange("state",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

<input
type="text"
placeholder="Zip Code"
value={form.zipCode}
onChange={(e)=>handleChange("zipCode",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

<input
type="text"
placeholder="Country"
value={form.country}
onChange={(e)=>handleChange("country",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
/>

</div>

</div>

{/* ================= Business Information ================= */}

<div className="border border-slate-200 rounded-xl p-5 space-y-4">

<h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <Briefcase className="w-5 h-5 text-primary-600" />
    Business Information
</h3>

<div className="grid md:grid-cols-2 gap-4">

<div>

<label className="block text-sm font-medium text-slate-700 mb-1">
Business Vertical
</label>

<select
value={form.businessVertical}
onChange={(e)=>handleChange("businessVertical",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
>

<option value="">Select Vertical</option>

{businessVerticalOptions.map((item)=>(
<option
key={item}
value={item}
>
{item}
</option>
))}

</select>

</div>

<div>

<label className="block text-sm font-medium text-slate-700 mb-1">
Use Case
</label>

<select
value={form.useCase}
onChange={(e)=>handleChange("useCase",e.target.value)}
className="w-full px-3 py-2 border border-slate-300 rounded-lg"
>

<option value="">Select Use Case</option>

{useCaseOptions.map((item)=>(
<option
key={item}
value={item}
>
{item}
</option>
))}

</select>

</div>

</div>

</div>
{/* ================= Account Security ================= */}

{!initialData && (
  <div className="border border-slate-200 rounded-xl p-5 space-y-4">

<h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <Shield className="w-5 h-5 text-primary-600" />
    Account Security
</h3>

    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={form.setPasswordNow}
        onChange={(e) =>
          handleChange("setPasswordNow", e.target.checked)
        }
        className="w-4 h-4"
      />

      <span className="text-sm font-medium">
        Set Password Now
      </span>
    </label>

    {form.setPasswordNow && (
      <input
        type="password"
        value={form.password}
        onChange={(e) =>
          handleChange("password", e.target.value)
        }
        placeholder="Enter Password"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      />
    )}

  </div>
)}
<div className="sticky bottom-0 bg-white border-t border-slate-200 flex justify-end gap-3 p-6">
<button
type="button"
onClick={onClose}
className="px-6 py-2.5 border rounded-lg hover:bg-slate-50"
>
Cancel
</button>

<button
type="submit"
disabled={loading}
className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
>
{loading
? "Saving..."
: initialData
? "Update Tenant"
: "Create Tenant"}
</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TenantForm