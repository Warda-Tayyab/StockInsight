import { Settings } from 'lucide-react'
import { integrations } from '../../data/dummyData'

function IntegrationCard({ name, status, description, onConfigure }) {
  const isConnected = status === 'Connected'
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          <span
            className={`inline-flex mt-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {status}
          </span>
        </div>
        <button
          type="button"
          onClick={onConfigure}
          className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <Settings className="w-4 h-4" />
          Configure
        </button>
      </div>
    </div>
  )
}

function Integrations() {
  const handleConfigure = (id) => {
    console.log('Configure', id)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="mt-1 text-slate-600">Manage third-party services and webhooks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            status={integration.status}
            description={integration.description}
            onConfigure={() => handleConfigure(integration.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default Integrations
