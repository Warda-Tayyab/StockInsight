import { systemAlerts } from '../data/mockData'

function levelStyles(level) {
  switch (level) {
    case 'critical':
      return 'border-rose-200 bg-rose-50 text-rose-800'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">
            High‑priority subscription alerts, system announcements and AI‑flagged activity.
          </p>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-card-header">
          <div>
            <p className="sa-card-title">Control plane feed</p>
            <p className="sa-card-subtitle">
              This stream is generated from static data for the demo.
            </p>
          </div>
        </div>
        <div className="sa-card-body space-y-3">
          {systemAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 text-xs ${levelStyles(
                alert.level,
              )}`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  {alert.type}
                </span>
                <span className="sa-badge bg-black/5 text-[10px]">
                  {alert.level.toUpperCase()}
                </span>
                <span className="ml-auto text-[10px] opacity-70">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-800">{alert.message}</p>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-slate-500">
            In a production deployment this feed would be backed by a notifications service (for
            example using websockets or polling), but for your final year project the static yet
            realistic messages above demonstrate the end‑to‑end UI.
          </p>
        </div>
      </section>
    </div>
  )
}

