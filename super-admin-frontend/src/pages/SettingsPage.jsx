import { useState } from 'react'

export default function SettingsPage() {
  const [platformName, setPlatformName] = useState('StockInsight Control Plane')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSavePlatform = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      // UI‑only toast alternative
      alert('Platform settings saved (demo only).')
    }, 600)
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    alert('Password change simulated for demo.')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">System settings</h2>
        <p className="text-xs text-slate-500">
          Configure global platform options for all tenants.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <form
          onSubmit={handleSavePlatform}
          className="sa-card lg:col-span-2 space-y-3"
        >
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Platform identity</p>
              <p className="sa-card-subtitle">
                Controls the branding shown across tenant consoles.
              </p>
            </div>
          </div>
          <div className="sa-card-body space-y-4 text-sm">
            <div>
              <label className="sa-label">Platform name</label>
              <input
                className="sa-input"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="sa-label">Primary support email</label>
                <input
                  className="sa-input"
                  defaultValue="support@stockinsight.sa"
                />
              </div>
              <div>
                <label className="sa-label">Region default</label>
                <select className="sa-select" defaultValue="US-East">
                  <option>US-East</option>
                  <option>US-West</option>
                  <option>EU-West</option>
                  <option>AP-South</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <div>
                <p className="font-medium text-slate-800">Maintenance mode</p>
                <p className="text-[11px] text-slate-500">
                  When enabled, tenant consoles will see a read‑only banner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode((m) => !m)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition ${
                  maintenanceMode
                    ? 'border-amber-400 bg-amber-400/20'
                    : 'border-slate-300 bg-slate-100'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    maintenanceMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            <button
              type="submit"
              className="sa-btn-primary text-xs"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="sa-card space-y-3 text-sm"
        >
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Change admin password</p>
              <p className="sa-card-subtitle">
                This is simulated in the Frontend for your project.
              </p>
            </div>
          </div>
          <div className="sa-card-body space-y-3">
            <div>
              <label className="sa-label">Current password</label>
              <input type="password" className="sa-input" required />
            </div>
            <div>
              <label className="sa-label">New password</label>
              <input type="password" className="sa-input" required />
            </div>
            <div>
              <label className="sa-label">Confirm new password</label>
              <input type="password" className="sa-input" required />
            </div>
            <button type="submit" className="sa-btn-primary mt-1 w-full text-xs">
              Update password
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

