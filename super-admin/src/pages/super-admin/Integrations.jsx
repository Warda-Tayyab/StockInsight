import { Settings, Power, Mail, CreditCard, BarChart3, Webhook } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import IntegrationConfigModal from '../../components/super-admin/IntegrationConfigModal'

const categoryLabels = {
  communication: 'Communication',
  payment: 'Payment',
  analytics: 'Analytics',
  automation: 'Automation'
}

const iconByKey = {
  email: Mail,
  payment: CreditCard,
  analytics: BarChart3,
  webhooks: Webhook
}

function IntegrationCard({ integration, onConfigure, onToggle, toggling }) {
  const isConnected = integration.status === 'connected'
  const Icon = iconByKey[integration.key] || Settings

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{integration.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{categoryLabels[integration.category] || integration.category}</p>
            </div>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {integration.statusLabel || (isConnected ? 'Connected' : 'Not Connected')}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{integration.description}</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onConfigure(integration)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Settings className="w-4 h-4" />
          Configure
        </button>
        <button
          type="button"
          onClick={() => onToggle(integration)}
          disabled={toggling}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
            isConnected
              ? 'border border-red-200 text-red-600 hover:bg-red-50'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          <Power className="w-4 h-4" />
          {toggling ? 'Updating...' : isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

function Integrations() {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/integrations')
      setIntegrations(res.data.integrations || [])
    } catch (error) {
      console.error('Failed to fetch integrations', error)
      toast.error('Unable to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const updateIntegrationInList = (updated) => {
    setIntegrations((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item))
    )
  }

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration)
    setModalOpen(true)
  }

  const handleSave = async (config) => {
    try {
      const res = await api.put(`/api/admin/integrations/${selectedIntegration._id}`, { config })
      updateIntegrationInList(res.data.integration)
      toast.success('Configuration saved successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save configuration.'
      toast.error(message)
      throw error
    }
  }

  const handleTest = async (config, testEmail) => {
    try {
      await api.put(`/api/admin/integrations/${selectedIntegration._id}`, { config })
      const res = await api.post(`/api/admin/integrations/${selectedIntegration._id}/test`, {
        testEmail
      })
      toast.success(res.data.message || 'Test successful!')
      await fetchIntegrations()
    } catch (error) {
      const message = error.response?.data?.message || 'Integration test failed.'
      toast.error(message)
      throw error
    }
  }

  const handleToggle = async (integration) => {
    try {
      setTogglingId(integration._id)
      const res = await api.patch(`/api/admin/integrations/${integration._id}/toggle`)
      updateIntegrationInList(res.data.integration)
      const label = res.data.integration.status === 'connected' ? 'Connected' : 'Disconnected'
      toast.success(`${integration.name} is now ${label}`)
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update integration status'
      toast.error(message)
    } finally {
      setTogglingId(null)
    }
  }

  const connectedCount = integrations.filter((i) => i.status === 'connected').length

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
          <p className="mt-1 text-slate-600">Manage third-party services and webhooks.</p>
        </div>
        {!loading && (
          <div className="text-sm text-slate-500">
            {connectedCount} of {integrations.length} connected
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading integrations...</p>
      ) : integrations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No integrations found. Run the seed script to add defaults.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration._id}
              integration={integration}
              onConfigure={handleConfigure}
              onToggle={handleToggle}
              toggling={togglingId === integration._id}
            />
          ))}
        </div>
      )}

      <IntegrationConfigModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedIntegration(null)
        }}
        integration={selectedIntegration}
        onSave={handleSave}
        onTest={handleTest}
      />
    </div>
  )
}

export default Integrations
