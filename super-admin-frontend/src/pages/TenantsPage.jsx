import { useMemo, useState } from 'react'
import { tenants as seedTenants, plans } from '../data/mockData'

const statusFilters = ['All', 'Active', 'Suspended']
const planFilters = ['All', ...plans.map((p) => p.name)]

function TenantModal({ open, mode, tenant, onClose, onSave }) {
  const [form, setForm] = useState(
    tenant || {
      companyName: '',
      ownerName: '',
      email: '',
      plan: 'Pro',
      status: 'Active',
    },
  )

  if (!open) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit tenant' : 'Create tenant'}
            </h2>
            <p className="text-xs text-slate-500">
              Manage company details, plan and status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sa-btn-ghost h-8 w-8 justify-center rounded-full p-0"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 6 18 18M6 18 18 6" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="sa-label">Company</label>
              <input
                className="sa-input"
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="sa-label">Owner</label>
              <input
                className="sa-input"
                value={form.ownerName}
                onChange={(e) => handleChange('ownerName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="sa-label">Email</label>
            <input
              type="email"
              className="sa-input"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="sa-label">Plan</label>
              <select
                className="sa-select"
                value={form.plan}
                onChange={(e) => handleChange('plan', e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="sa-label">Status</label>
              <select
                className="sa-select"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="sa-btn-ghost text-xs"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="sa-btn-primary text-xs">
              {mode === 'edit' ? 'Save changes' : 'Create tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TenantsPage() {
  const [rows, setRows] = useState(seedTenants)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [plan, setPlan] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTenant, setModalTenant] = useState(null)
  const [modalMode, setModalMode] = useState('create')

  const filtered = useMemo(
    () =>
      rows.filter((t) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          t.companyName.toLowerCase().includes(q) ||
          t.ownerName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
        const matchesStatus = status === 'All' || t.status === status
        const matchesPlan = plan === 'All' || t.plan === plan
        return matchesSearch && matchesStatus && matchesPlan
      }),
    [rows, search, status, plan],
  )

  const openCreate = () => {
    setModalTenant(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const openEdit = (tenant) => {
    setModalTenant(tenant)
    setModalMode('edit')
    setModalOpen(true)
  }

  const toggleStatus = (id) => {
    setRows((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' } : t,
      ),
    )
  }

  const removeTenant = (id) => {
    if (!window.confirm('Delete this tenant?')) return
    setRows((prev) => prev.filter((t) => t.id !== id))
  }

  const handleSave = (data) => {
    if (modalMode === 'edit' && modalTenant) {
      setRows((prev) =>
        prev.map((t) => (t.id === modalTenant.id ? { ...t, ...data } : t)),
      )
    } else {
      const id = `tnt-${(rows.length + 1).toString().padStart(3, '0')}`
      setRows((prev) => [
        {
          id,
          createdAt: new Date().toISOString().slice(0, 10),
          expiringInDays: 30,
          usageScore: 50,
          region: 'US-East',
          ...data,
        },
        ...prev,
      ])
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Tenant management</h2>
          <p className="text-xs text-slate-500">
            Create, edit and govern tenant companies using the platform.
          </p>
        </div>
        <button type="button" className="sa-btn-primary text-xs" onClick={openCreate}>
          + New tenant
        </button>
      </div>

      <div className="sa-card">
        <div className="sa-card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="sa-card-title">Tenants</p>
            <p className="sa-card-subtitle">
              {filtered.length} of {rows.length} tenants visible
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              className="sa-input w-full sm:w-56"
              placeholder="Search company, owner or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="sa-select sm:w-32"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusFilters.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="sa-select sm:w-32"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              {planFilters.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sa-card-body overflow-x-auto">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Company</th>
                <th className="hidden sm:table-cell">Owner</th>
                <th className="hidden md:table-cell">Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {t.companyName}
                      </span>
                      <span className="text-[11px] text-slate-500">{t.id}</span>
                    </div>
                  </td>
                  <td className="hidden text-sm text-slate-700 sm:table-cell">
                    {t.ownerName}
                  </td>
                  <td className="hidden text-xs text-slate-500 md:table-cell">
                    {t.email}
                  </td>
                  <td>
                    <span
                      className={`sa-badge ${
                        t.plan === 'Enterprise'
                          ? 'bg-violet-50 text-violet-700'
                          : t.plan === 'Pro'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.plan}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleStatus(t.id)}
                      className={`sa-badge border text-[11px] ${
                        t.status === 'Active'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                          : 'border-amber-100 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.status}
                    </button>
                  </td>
                  <td className="hidden text-xs text-slate-500 md:table-cell">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="sa-btn-ghost px-2 py-1 text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTenant(t.id)}
                        className="sa-btn-danger px-2 py-1 text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-xs text-slate-400"
                  >
                    No tenants match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TenantModal
        open={modalOpen}
        mode={modalMode}
        tenant={modalTenant}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}

