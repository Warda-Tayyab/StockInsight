import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'

const WEBHOOK_EVENTS = [
  'tenant.created',
  'tenant.updated',
  'tenant.suspended',
  'subscription.changed'
]

const defaultConfigByKey = {
  email: {
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    fromName: 'StockInsights'
  },
  payment: {
    provider: 'stripe',
    publishableKey: '',
    secretKey: '',
    webhookSecret: ''
  },
  analytics: {
    provider: 'google',
    trackingId: '',
    measurementId: ''
  },
  webhooks: {
    endpointUrl: '',
    secretKey: '',
    events: ['tenant.created', 'tenant.updated']
  }
}

function IntegrationConfigModal({ isOpen, onClose, integration, onSave, onTest }) {
  const [config, setConfig] = useState({})
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (integration && isOpen) {
      setConfig({
        ...defaultConfigByKey[integration.key],
        ...(integration.config || {})
      })
      setTestEmail('')
      setErrors({})
    }
  }, [integration, isOpen])

  if (!isOpen || !integration) return null

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const toggleEvent = (event) => {
    setConfig((prev) => {
      const events = prev.events || []
      return {
        ...prev,
        events: events.includes(event)
          ? events.filter((e) => e !== event)
          : [...events, event]
      }
    })
  }

  const validate = () => {
    const next = {}
    const key = integration.key

    if (key === 'email') {
      if (!config.smtpHost?.trim()) next.smtpHost = 'SMTP host is required.'
      if (!config.smtpPort) next.smtpPort = 'SMTP port is required.'
      if (!config.smtpUser?.trim()) next.smtpUser = 'SMTP user is required.'
      if (!config.smtpPass?.trim()) next.smtpPass = 'SMTP password is required.'
      if (!config.smtpFrom?.trim()) next.smtpFrom = 'From email is required.'
    } else if (key === 'payment') {
      if (!config.publishableKey?.trim()) next.publishableKey = 'Publishable key is required.'
      if (!config.secretKey?.trim()) next.secretKey = 'Secret key is required.'
    } else if (key === 'analytics') {
      if (!config.trackingId?.trim()) next.trackingId = 'Tracking ID is required.'
    } else if (key === 'webhooks') {
      if (!config.endpointUrl?.trim()) next.endpointUrl = 'Webhook URL is required.'
      if (!config.secretKey?.trim()) next.secretKey = 'Secret key is required.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await onSave?.(config)
      onClose?.()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!validate()) return
    if (integration.key === 'email' && !testEmail.trim()) {
      setErrors((prev) => ({ ...prev, testEmail: 'Enter a test email address.' }))
      return
    }

    setTesting(true)
    try {
      await onTest?.(config, testEmail.trim())
    } catch (err) {
      console.error(err)
    } finally {
      setTesting(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'

  const renderFields = () => {
    switch (integration.key) {
      case 'email':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host *</label>
                <input type="text" value={config.smtpHost || ''} onChange={(e) => handleChange('smtpHost', e.target.value)} className={inputClass} placeholder="smtp.gmail.com" />
                {errors.smtpHost && <p className="mt-1 text-sm text-red-600">{errors.smtpHost}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port *</label>
                <input type="number" value={config.smtpPort || ''} onChange={(e) => handleChange('smtpPort', e.target.value)} className={inputClass} placeholder="587" />
                {errors.smtpPort && <p className="mt-1 text-sm text-red-600">{errors.smtpPort}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Username *</label>
              <input type="text" value={config.smtpUser || ''} onChange={(e) => handleChange('smtpUser', e.target.value)} className={inputClass} />
              {errors.smtpUser && <p className="mt-1 text-sm text-red-600">{errors.smtpUser}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Password *</label>
              <input type="password" value={config.smtpPass || ''} onChange={(e) => handleChange('smtpPass', e.target.value)} className={inputClass} placeholder="Leave unchanged if masked" />
              {errors.smtpPass && <p className="mt-1 text-sm text-red-600">{errors.smtpPass}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Email *</label>
                <input type="email" value={config.smtpFrom || ''} onChange={(e) => handleChange('smtpFrom', e.target.value)} className={inputClass} />
                {errors.smtpFrom && <p className="mt-1 text-sm text-red-600">{errors.smtpFrom}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Name</label>
                <input type="text" value={config.fromName || ''} onChange={(e) => handleChange('fromName', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">Test Email Address</label>
              <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
              {errors.testEmail && <p className="mt-1 text-sm text-red-600">{errors.testEmail}</p>}
            </div>
          </>
        )

      case 'payment':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
              <input type="text" value={config.provider || 'stripe'} readOnly className={`${inputClass} bg-slate-50`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Publishable Key *</label>
              <input type="text" value={config.publishableKey || ''} onChange={(e) => handleChange('publishableKey', e.target.value)} className={inputClass} placeholder="pk_live_..." />
              {errors.publishableKey && <p className="mt-1 text-sm text-red-600">{errors.publishableKey}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key *</label>
              <input type="password" value={config.secretKey || ''} onChange={(e) => handleChange('secretKey', e.target.value)} className={inputClass} placeholder="sk_live_..." />
              {errors.secretKey && <p className="mt-1 text-sm text-red-600">{errors.secretKey}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Secret</label>
              <input type="password" value={config.webhookSecret || ''} onChange={(e) => handleChange('webhookSecret', e.target.value)} className={inputClass} placeholder="whsec_..." />
            </div>
          </>
        )

      case 'analytics':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
              <input type="text" value={config.provider || 'google'} readOnly className={`${inputClass} bg-slate-50`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tracking ID *</label>
              <input type="text" value={config.trackingId || ''} onChange={(e) => handleChange('trackingId', e.target.value)} className={inputClass} placeholder="G-XXXXXXXXXX" />
              {errors.trackingId && <p className="mt-1 text-sm text-red-600">{errors.trackingId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Measurement ID</label>
              <input type="text" value={config.measurementId || ''} onChange={(e) => handleChange('measurementId', e.target.value)} className={inputClass} placeholder="Optional" />
            </div>
          </>
        )

      case 'webhooks':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL *</label>
              <input type="url" value={config.endpointUrl || ''} onChange={(e) => handleChange('endpointUrl', e.target.value)} className={inputClass} placeholder="https://your-app.com/webhooks" />
              {errors.endpointUrl && <p className="mt-1 text-sm text-red-600">{errors.endpointUrl}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key *</label>
              <input type="password" value={config.secretKey || ''} onChange={(e) => handleChange('secretKey', e.target.value)} className={inputClass} />
              {errors.secretKey && <p className="mt-1 text-sm text-red-600">{errors.secretKey}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Events</label>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(config.events || []).includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="w-4 h-4"
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </>
        )

      default:
        return <p className="text-sm text-slate-500">No configuration available.</p>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Configure {integration.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{integration.description}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {renderFields()}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <div className="flex gap-3 flex-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IntegrationConfigModal
