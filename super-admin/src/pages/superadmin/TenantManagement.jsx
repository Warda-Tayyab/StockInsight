import { useState } from 'react'

const PLANS = ['Basic', 'Pro', 'Enterprise']
const STATUSES = ['active', 'suspended', 'expired']

const initialTenants = [
  { id: 1, name: 'Acme Corporation', email: 'admin@acme.com', plan: 'Enterprise', status: 'active', createdAt: '2024-01-15', revenue: 12500 },
  { id: 2, name: 'TechStart Inc', email: 'contact@techstart.com', plan: 'Pro', status: 'active', createdAt: '2024-02-10', revenue: 8500 },
  { id: 3, name: 'Global Solutions', email: 'info@globalsolutions.com', plan: 'Basic', status: 'suspended', createdAt: '2023-12-05', revenue: 2500 },
  { id: 4, name: 'Innovate Labs', email: 'hello@innovatelabs.com', plan: 'Enterprise', status: 'active', createdAt: '2024-01-20', revenue: 15000 },
  { id: 5, name: 'Digital Ventures', email: 'admin@digitalventures.com', plan: 'Pro', status: 'expired', createdAt: '2023-11-12', revenue: 6000 }
]

function TenantManagement() {
  const [tenants, setTenants] = useState(initialTenants)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTenantId, setEditTenantId] = useState(null)
  const [deleteTenantId, setDeleteTenantId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    plan: 'Pro',
    status: 'active',
    revenue: 5000
  })

  const getToday = () => new Date().toISOString().slice(0, 10)

  const openAddModal = () => {
    setForm({
      name: '',
      email: '',
      plan: 'Pro',
      status: 'active',
      revenue: 5000
    })
    setShowAddModal(true)
  }

  const openEditModal = (tenant) => {
    setForm({
      name: tenant.name,
      email: tenant.email,
      plan: tenant.plan,
      status: tenant.status,
      revenue: tenant.revenue
    })
    setEditTenantId(tenant.id)
  }

  const closeAddModal = () => setShowAddModal(false)
  const closeEditModal = () => setEditTenantId(null)
  const closeDeleteModal = () => setDeleteTenantId(null)

  const handleAddSubmit = (e) => {
    e.preventDefault()
    const newId = Math.max(0, ...tenants.map((t) => t.id)) + 1
    setTenants([
      ...tenants,
      {
        id: newId,
        name: form.name.trim(),
        email: form.email.trim(),
        plan: form.plan,
        status: form.status,
        createdAt: getToday(),
        revenue: Number(form.revenue) || 0
      }
    ])
    closeAddModal()
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editTenantId) return
    setTenants(
      tenants.map((t) =>
        t.id === editTenantId
          ? {
              ...t,
              name: form.name.trim(),
              email: form.email.trim(),
              plan: form.plan,
              status: form.status,
              revenue: Number(form.revenue) || 0
            }
          : t
      )
    )
    closeEditModal()
  }

  const handleDeleteConfirm = () => {
    if (!deleteTenantId) return
    setTenants(tenants.filter((t) => t.id !== deleteTenantId))
    closeDeleteModal()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-rose-100 text-rose-700'
    }
    return (
      <span className={`sa-badge ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPlanBadge = (plan) => {
    const styles = {
      Basic: 'bg-slate-100 text-slate-700',
      Pro: 'bg-blue-100 text-blue-700',
      Enterprise: 'bg-purple-100 text-purple-700'
    }
    return (
      <span className={`sa-badge ${styles[plan] || 'bg-slate-100 text-slate-700'}`}>
        {plan}
      </span>
    )
  }

  const tenantToDelete = deleteTenantId ? tenants.find((t) => t.id === deleteTenantId) : null

  const formFields = (
    <>
      <div>
        <label htmlFor="tenant-name" className="sa-label">Company Name</label>
        <input
          id="tenant-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="sa-input"
          placeholder="Acme Inc"
          required
        />
      </div>
      <div>
        <label htmlFor="tenant-email" className="sa-label">Email</label>
        <input
          id="tenant-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="sa-input"
          placeholder="admin@company.com"
          required
        />
      </div>
      <div>
        <label htmlFor="tenant-plan" className="sa-label">Plan</label>
        <select
          id="tenant-plan"
          value={form.plan}
          onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
          className="sa-select"
        >
          {PLANS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="tenant-status" className="sa-label">Status</label>
        <select
          id="tenant-status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          className="sa-select"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="tenant-revenue" className="sa-label">Revenue ($)</label>
        <input
          id="tenant-revenue"
          type="number"
          min="0"
          value={form.revenue}
          onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
          className="sa-input"
        />
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-slate-500 mt-1">
            Manage all tenants and their subscriptions
          </p>
        </div>
        <button type="button" onClick={openAddModal} className="sa-btn-primary shrink-0">
          + Add Tenant
        </button>
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Revenue</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <span className="font-medium text-slate-900">{tenant.name}</span>
                </td>
                <td>
                  <span className="text-slate-600">{tenant.email}</span>
                </td>
                <td>{getPlanBadge(tenant.plan)}</td>
                <td>{getStatusBadge(tenant.status)}</td>
                <td>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(tenant.revenue)}
                  </span>
                </td>
                <td>
                  <span className="text-slate-600">{tenant.createdAt}</span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(tenant)}
                      className="sa-btn-secondary text-xs px-3 py-1.5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTenantId(tenant.id)}
                      className="sa-btn-danger text-xs px-3 py-1.5"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="sa-modal-overlay" onClick={closeAddModal}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2 className="text-lg font-semibold text-slate-900">Add Tenant</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="sa-modal-body space-y-4">
                {formFields}
              </div>
              <div className="sa-modal-footer">
                <button type="button" onClick={closeAddModal} className="sa-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="sa-btn-primary">
                  Add Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editTenantId !== null && (
        <div className="sa-modal-overlay" onClick={closeEditModal}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2 className="text-lg font-semibold text-slate-900">Edit Tenant</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="sa-modal-body space-y-4">
                {formFields}
              </div>
              <div className="sa-modal-footer">
                <button type="button" onClick={closeEditModal} className="sa-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="sa-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTenantId !== null && tenantToDelete && (
        <div className="sa-modal-overlay" onClick={closeDeleteModal}>
          <div className="sa-modal max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2 className="text-lg font-semibold text-slate-900">Delete Tenant</h2>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="sa-modal-body">
              <p className="text-slate-600">
                Are you sure you want to delete <strong className="text-slate-900">{tenantToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="sa-modal-footer">
              <button type="button" onClick={closeDeleteModal} className="sa-btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="sa-btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TenantManagement
