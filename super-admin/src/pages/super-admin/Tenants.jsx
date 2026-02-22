import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import TenantTable from '../../components/super-admin/TenantTable'
import TenantForm from '../../components/super-admin/TenantForm'
import { tenantsList } from '../../data/dummyData'

const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Trial', 'Suspended']

function Tenants() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [tenants, setTenants] = useState(tenantsList)

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.companyName.toLowerCase().includes(search.toLowerCase()) ||
        t.ownerEmail.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'All' || t.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [tenants, search, statusFilter])

  const handleCreateTenant = (formData) => {
    const newTenant = {
      id: String(tenants.length + 1),
      companyName: formData.tenantName,
      slug: formData.slug,
      ownerEmail: formData.ownerEmail,
      status: formData.status,
      region: formData.region,
      plan: 'Starter',
      businessVertical: formData.businessVertical,
      useCase: formData.useCase,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setTenants((prev) => [newTenant, ...prev])
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
          <p className="mt-1 text-slate-600">Manage organizations and their subscriptions.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Tenant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[160px]"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <TenantTable tenants={filteredTenants} />
      <TenantForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateTenant}
      />
    </div>
  )
}

export default Tenants
