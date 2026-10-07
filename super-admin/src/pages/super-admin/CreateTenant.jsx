import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import TenantForm from '../../components/super-admin/TenantForm'

function CreateTenant() {
  const navigate = useNavigate()

  const handleCreateTenant = async (formData) => {
    try {
      await api.post('/api/admin/tenants', formData)

      toast.success('Tenant created successfully!')
      navigate('/super-admin/tenants')
    } catch (error) {
      console.error(error)
      toast.error('Failed to create tenant')
    }
  }
  return (
    <TenantForm
      isOpen={true}
      onSubmit={handleCreateTenant}
      onClose={() => navigate('/super-admin/tenants')}
    />
  
  )
}

export default CreateTenant