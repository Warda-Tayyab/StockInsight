import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit, ChevronDown } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import toast from "react-hot-toast";
import api from '../../utils/api'
const statusStyles = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
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

function TenantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [tenant, setTenant] = useState(state?.tenant || null)
  const [loading, setLoading] = useState(!state?.tenant)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const statuses = [
    { name: 'active', color: 'bg-green-100 hover:bg-green-200 text-green-800' },
    { name: 'trial', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
    { name: 'suspended', color: 'bg-red-100 hover:bg-red-200 text-red-800' },
  ]

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch tenant on page reload
  useEffect(() => {
    if (!state?.tenant) {
      const fetchTenant = async () => {
        try {
          setLoading(true)
          const token = localStorage.getItem('superAdminToken')
          const res = await api.get(`/api/admin/tenants/${id}`)

          setTenant(res.data.tenant)
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }
      fetchTenant()
    }
  }, [id, state])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading tenant...</p>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Tenant not found.</p>
        <button
          type="button"
          onClick={() => navigate('/super-admin/tenants')}
          className="mt-4 text-primary-600 hover:underline"
        >
          Back to Tenants
        </button>
      </div>
    )
  }
  const updateTenant = async (formData) => {

    try {

      const res = await api.put(

        `/api/admin/tenants/${tenant._id}`,

        formData

      );

      setTenant(res.data.tenant);

      toast.success("Tenant updated");

      setEditOpen(false);

    }
    catch (err) {

      toast.error("Update failed");

    }

  }
  const changeStatus = async (status) => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      toast.error("Unauthorized access")
      return
    }
    try {
      const res = await api.patch(
        `/api/admin/tenants/${tenant._id}/status`,
        { status }
      )

      setTenant(prev => ({ ...prev, status }))
      setDropdownOpen(false)
      toast.success(`Tenant status updated to ${status}`)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status")
    }
  }

  const handleArchive = async () => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) return alert('Unauthorized')
    if (!window.confirm('Are you sure you want to archieve this tenant?')) return
    try {
      await api.delete(`/api/admin/tenants/${tenant._id}`)

      toast.success("Tenant archieved successfully")

      setTimeout(() => {
        navigate('/super-admin/tenants')
      }, 1500)
    } catch (error) {
      console.error(error)
    }
  }
  const restoreTenant = async () => {

    try {

      await api.patch(`/api/admin/tenants/${tenant._id}/restore`);
      toast.success("Tenant restored");
      setTenant(prev => ({
        ...prev,
        isArchived: false
      }))
    }
    catch (err) {
      toast.error("Failed");
    }

  }
  const handleEdit = () => navigate(`/super-admin/tenants/edit/${tenant._id}`, { state: { tenant } })

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/super-admin/tenants')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tenants
      </button>

      {/* Tenant Card */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex flex-wrap justify-between items-center border-b border-slate-200 gap-4">
          <div className="flex items-center gap-4"> <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1> <StatusBadge status={tenant.status} /> </div>


          <div className="flex gap-2 items-center">
            {/* Dropdown */}
            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-100 transition"
              >
                Change Status <ChevronDown className="w-4 h-4" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {statuses.map(({ name, color }) => (
                    <button
                      key={name}
                      onClick={() => changeStatus(name)}
                      className={`w-full text-left px-4 py-2 capitalize text-sm font-medium ${color} transition`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit & Delete */}
            <button
  onClick={() =>
    navigate(`/super-admin/tenants/edit/${tenant._id}`, {
      state: { tenant }
    })
  }
  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
>
  <Edit className="w-4 h-4" /> Edit
</button>
            {
              tenant.isArchived ? (

                <button
                  onClick={restoreTenant}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                >
                  Restore
</button>

              ) : (

                  <button
                    onClick={handleArchive}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  >
                    Archive
</button>

                )
            }
            
          </div>
          
        </div>
        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

{/* Tenant Information */}
<div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

  <h3 className="text-lg font-semibold text-slate-900 mb-5">
    Tenant Information
  </h3>

  <div className="space-y-4">

    <div className="flex justify-between">
      <span className="text-slate-500">Slug</span>
      <span className="font-medium">{tenant.slug}</span>
    </div>

    <div className="flex justify-between">
      <span className="text-slate-500">Plan</span>
      <span>{tenant.plan || "-"}</span>
    </div>

    <div className="flex justify-between">
      <span className="text-slate-500">Created Date</span>
      <span>
        {new Date(tenant.createdAt).toLocaleDateString()}
      </span>
    </div>

  </div>

</div>



{/* Owner Information */}
<div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

  <h3 className="text-lg font-semibold text-slate-900 mb-5">
    Owner Information
  </h3>


  <div className="space-y-4">

    <div className="flex justify-between">
      <span className="text-slate-500">Name</span>
      <span>
        {tenant.ownerUserId?.firstName || "-"}{" "}
        {tenant.ownerUserId?.lastName || ""}
      </span>
    </div>


    <div className="flex justify-between">
      <span className="text-slate-500">Email</span>
      <span>{tenant.ownerEmail}</span>
    </div>


    <div className="flex justify-between">
      <span className="text-slate-500">Account</span>
      <span className="capitalize">
        {tenant.ownerUserId?.status || "-"}
      </span>
    </div>


  </div>

</div>




{/* Primary Contact */}
<div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

  <h3 className="text-lg font-semibold text-slate-900 mb-5">
    Primary Contact
  </h3>


  <div className="space-y-4">

    <div className="flex justify-between">
      <span className="text-slate-500">Contact Name</span>
      <span>
        {tenant.primaryContact?.name || "-"}
      </span>
    </div>


    <div className="flex justify-between">
      <span className="text-slate-500">Phone</span>
      <span>
        {tenant.primaryContact?.phone || "-"}
      </span>
    </div>


    <div className="flex justify-between">
      <span className="text-slate-500">Timezone</span>
      <span>
        {tenant.primaryContact?.timezone || "-"}
      </span>
    </div>


  </div>


</div>





{/* Business Information */}
<div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

  <h3 className="text-lg font-semibold text-slate-900 mb-5">
    Business Information
  </h3>


  <div className="space-y-4">


    <div className="flex justify-between">
      <span className="text-slate-500">
        Business Vertical
      </span>

      <span>
        {tenant.business?.verticals?.join(", ") || "-"}
      </span>

    </div>



    <div className="flex justify-between">

      <span className="text-slate-500">
        Use Case
      </span>

      <span>
        {tenant.business?.useCases?.join(", ") || "-"}
      </span>

    </div>


  </div>


</div>
{/* Business Address */}

<div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

<h3 className="text-lg font-semibold text-slate-900 mb-5">
Business Address
</h3>


<div className="space-y-4">


<div className="flex justify-between">
<span className="text-slate-500">
Street
</span>

<span>
{tenant.primaryContact?.address?.street || "-"}
</span>

</div>



<div className="flex justify-between">
<span className="text-slate-500">
City
</span>

<span>
{tenant.primaryContact?.address?.city || "-"}
</span>

</div>



<div className="flex justify-between">
<span className="text-slate-500">
State
</span>

<span>
{tenant.primaryContact?.address?.state || "-"}
</span>

</div>



<div className="flex justify-between">
<span className="text-slate-500">
Zip Code
</span>

<span>
{tenant.primaryContact?.address?.zipCode || "-"}
</span>

</div>



<div className="flex justify-between">
<span className="text-slate-500">
Country
</span>

<span>
{tenant.primaryContact?.address?.country || "-"}
</span>

</div>


</div>

</div>

</div>
</div>


      
      </div>
      )
    }
    
export default TenantDetails