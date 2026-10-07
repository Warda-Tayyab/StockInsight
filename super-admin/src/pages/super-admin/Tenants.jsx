import { useState,useEffect, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import TenantTable from '../../components/super-admin/TenantTable'
import TenantForm from '../../components/super-admin/TenantForm'
import { useNavigate } from 'react-router-dom'
//import { tenantsList } from '../../data/dummyData'
import toast from 'react-hot-toast'
 import api from '../../utils/api'
const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Trial', 'Suspended']

function Tenants() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState([])
  const navigate = useNavigate()
  
  // ======================================
  // Fetch all tenants from backend
  // ======================================
  const fetchTenants = async (token) => {
  try {
    setLoading(true)
    const res = await api.get('/api/admin/tenants')

    setTenants(res.data.tenants)
  } catch (error) {
    console.error(error)
    toast.error('Failed to fetch tenants.')
  } finally {
    setLoading(false) // ✅ yeh har case me chalega
  }
}

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken') // 🔹 Super Admin only
    if (!token) {
      toast.error('You are not logged in as Super Admin! Please login.')
      return
    }
    console.log('Using Super Admin token:', token)
    fetchTenants(token)
    api.get('/api/admin/plans').then((res) => setPlans(res.data.plans || [])).catch(() => {})
  }, [])
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.ownerEmail?.toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === 'All' ||
        t.status?.trim().toLowerCase() === statusFilter.toLowerCase()

      return matchSearch && matchStatus
    })
  }, [tenants, search, statusFilter])

  // ======================================
  // CREATE TENANT
  // ======================================
  const handleCreateTenant = async (formData, setBackendErrors) => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      toast.error('Session expired. Please login again.')
      navigate('/super-admin/login')
      return
    }
    try {
      const res = await api.post('/api/admin/tenants', formData)

      setTenants((prev) => [res.data.tenant, ...prev])
      setFormOpen(false)
      toast.success('Tenant created successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong. Check console for details.')
    }
  }



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
          <p className="mt-1 text-slate-600">Manage organizations and their subscriptions.</p>
        </div>
        <div className="flex gap-3">
  <button
    type="button"
    onClick={() => navigate('/super-admin/tenants/archived')}
    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-xl font-medium hover:bg-slate-100 shadow-sm"
  >
    Archived Tenants
  </button>

  <button
    type="button"
    onClick={() => navigate('/super-admin/tenants/create')}
    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-sm"
  >
    <Plus className="w-5 h-5" />
    Create Tenant
  </button>
</div>
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

      {loading ? (
        <p className="text-center text-slate-500">Loading tenants...</p>
      ) : (
        <TenantTable
          tenants={filteredTenants}
          plans={plans}
          onView={(tenant) => {
            navigate(`/super-admin/tenants/${tenant._id}`, {
              state: { tenant }
            })
          }}
        />
      )}

    </div>
  )
}

export default Tenants
