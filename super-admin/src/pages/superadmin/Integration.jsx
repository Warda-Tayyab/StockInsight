import { useState } from 'react'

function Integration() {
  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      name: 'Stripe',
      description: 'Payment processing and billing',
      status: 'active',
      icon: '💳',
      category: 'Payment'
    },
    {
      id: 2,
      name: 'SendGrid',
      description: 'Email delivery service',
      status: 'active',
      icon: '📧',
      category: 'Communication'
    },
    {
      id: 3,
      name: 'AWS S3',
      description: 'Cloud storage for files',
      status: 'active',
      icon: '☁️',
      category: 'Storage'
    },
    {
      id: 4,
      name: 'Slack',
      description: 'Team notifications and alerts',
      status: 'inactive',
      icon: '💬',
      category: 'Communication'
    },
    {
      id: 5,
      name: 'Google Analytics',
      description: 'Website analytics and tracking',
      status: 'inactive',
      icon: '📊',
      category: 'Analytics'
    },
    {
      id: 6,
      name: 'Zapier',
      description: 'Automation and workflow integration',
      status: 'active',
      icon: '⚡',
      category: 'Automation'
    }
  ])

  const toggleIntegration = (id) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status: integration.status === 'active' ? 'inactive' : 'active'
            }
          : integration
      )
    )
  }

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="sa-badge bg-green-100 text-green-700">Active</span>
    ) : (
      <span className="sa-badge bg-slate-100 text-slate-600">Inactive</span>
    )
  }

  const getCategoryBadge = (category) => {
    const colors = {
      Payment: 'bg-blue-100 text-blue-700',
      Communication: 'bg-purple-100 text-purple-700',
      Storage: 'bg-indigo-100 text-indigo-700',
      Analytics: 'bg-green-100 text-green-700',
      Automation: 'bg-orange-100 text-orange-700'
    }
    return (
      <span
        className={`sa-badge ${colors[category] || 'bg-slate-100 text-slate-700'}`}
      >
        {category}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 mt-1">
          Manage third-party integrations and services
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="sa-card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-3xl shrink-0" aria-hidden>{integration.icon}</div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {integration.name}
                  </h3>
                  {getCategoryBadge(integration.category)}
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {integration.description}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4">
              <div>{getStatusBadge(integration.status)}</div>
              <button
                onClick={() => toggleIntegration(integration.id)}
                className={`sa-toggle ${integration.status === 'active' ? 'sa-toggle-on' : 'sa-toggle-off'}`}
                role="switch"
                aria-checked={integration.status === 'active'}
              >
                <span
                  className={`sa-toggle-thumb ${
                    integration.status === 'active'
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sa-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Integration Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-900">
              {integrations.filter((i) => i.status === 'active').length}
            </div>
            <div className="text-sm text-green-600 mt-1">Active Integrations</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-900">
              {integrations.filter((i) => i.status === 'inactive').length}
            </div>
            <div className="text-sm text-slate-500 mt-1">Inactive Integrations</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <div className="text-2xl font-bold text-indigo-900">
              {integrations.length}
            </div>
            <div className="text-sm text-indigo-600 mt-1">Total Integrations</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Integration
