import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import PlanGrid from '../../components/super-admin/PlanGrid'
import PlanForm from '../../components/super-admin/PlanForm'

function PricingPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/plans')
      setPlans(res.data.plans || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch pricing plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleCreate = async (payload) => {
    try {
      const res = await api.post('/api/admin/plans', payload)
      setPlans((prev) => [...prev, res.data.plan].sort((a, b) => a.sortOrder - b.sortOrder))
      setFormOpen(false)
      toast.success('Plan created successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create plan.'
      toast.error(message)
      throw error
    }
  }

  const handleUpdate = async (payload) => {
    try {
      const res = await api.put(`/api/admin/plans/${editingPlan._id}`, payload)
      setPlans((prev) =>
        prev
          .map((p) => (p._id === editingPlan._id ? res.data.plan : p))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      )
      setEditingPlan(null)
      toast.success('Plan updated successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update plan.'
      toast.error(message)
      throw error
    }
  }

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.displayName}"? This cannot be undone.`)) return

    try {
      await api.delete(`/api/admin/plans/${plan._id}`)
      setPlans((prev) => prev.filter((p) => p._id !== plan._id))
      toast.success('Plan deleted successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete plan.'
      toast.error(message)
    }
  }

  const openCreate = () => {
    setEditingPlan(null)
    setFormOpen(true)
  }

  const openEdit = (plan) => {
    setEditingPlan(plan)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingPlan(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pricing Plans</h1>
          <p className="mt-1 text-slate-600">
            Create and manage subscription plans for your tenants.
          </p>
        </div>
        <button
  type="button"
  onClick={openCreate}
  disabled={plans.length >= 3}
  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm
    ${
      plans.length >= 3
        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
        : 'bg-primary-600 text-white hover:bg-primary-700'
    }`}
>
  <Plus className="w-5 h-5" />
  Create Plan
</button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Loading pricing plans...</p>
      ) : (
        <PlanGrid plans={plans} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <PlanForm
        isOpen={formOpen}
        onClose={closeForm}
        onSubmit={editingPlan ? handleUpdate : handleCreate}
        initialData={editingPlan}
      />
    </div>
  )
}

export default PricingPlans
