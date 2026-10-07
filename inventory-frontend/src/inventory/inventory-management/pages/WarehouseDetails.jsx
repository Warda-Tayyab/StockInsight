import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from "../../../shared/utils/api";
const statusStyles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        statusStyles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  )
}

function WarehouseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [warehouse, setWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/api/warehouses/${id}`);
        setWarehouse(res.data.data);
      } catch (err) {
        console.error(err)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchWarehouse()
  }, [id, token])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading warehouse...</p>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Warehouse not found.</p>
        <button
          type="button"
          onClick={() => navigate('/settings/warehouses')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Back to Warehouses
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/settings/warehouses')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Warehouses
      </button>

      {/* Warehouse Card */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex flex-wrap justify-between items-center border-b border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900">{warehouse.name}</h1>
            <StatusBadge status={warehouse.status} />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 items-start">
          {/* Warehouse Info */}
          <div className="bg-slate-50 rounded-lg p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Warehouse Info</h3>
            {[
              ['Code', warehouse.code],
              ['Status', warehouse.status],
              ['Contact Person', warehouse.contactPerson],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col px-3 py-2 bg-white rounded-md shadow-sm">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-slate-800 font-semibold">{value || '-'}</p>
              </div>
            ))}
          </div>

          {/* Location & Contact */}
          <div className="bg-slate-50 rounded-lg p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Location & Contact</h3>
            {[
              ['Address', warehouse.address],
              ['City', warehouse.city],
              ['Country', warehouse.country],
              ['Postal Code', warehouse.postalCode],
              ['Phone', warehouse.phone],
              ['Email', warehouse.email],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col px-3 py-2 bg-white rounded-md shadow-sm">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-slate-800 font-semibold">{value || '-'}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-lg p-5 shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Description</h3>
            <p className="text-slate-500">{warehouse.description || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarehouseDetails