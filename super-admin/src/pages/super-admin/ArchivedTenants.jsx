import { useState, useEffect, useMemo } from 'react'
import { Search,ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import TenantTable from '../../components/super-admin/TenantTable'

function ArchivedTenants() {
  const [search, setSearch] = useState('')
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchTenants = async () => {
    try {
      setLoading(true)

      const res = await api.get('/api/admin/tenants/archived')

      setTenants(res.data.tenants)
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch archived tenants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken')

    if (!token) {
      toast.error('You are not logged in as Super Admin!')
      return
    }

    fetchTenants()
  }, [])

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      return (
        !search.trim() ||
        tenant.name?.toLowerCase().includes(search.toLowerCase()) ||
        tenant.ownerEmail?.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [tenants, search])

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/super-admin/tenants')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tenants
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Archived Tenants
        </h1>
        <p className="mt-1 text-slate-600">
          View and restore archived tenants.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {loading ? (
        <p className="text-center text-slate-500">
          Loading archived tenants...
        </p>
      ) : (
        <TenantTable
          tenants={filteredTenants}
          onView={(tenant) =>
            navigate(`/super-admin/tenants/${tenant._id}`, {
              state: { tenant },
            })
          }
        />
      )}
    </div>
  )
}

export default ArchivedTenants