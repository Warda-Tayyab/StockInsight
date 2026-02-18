import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('superadmin@stockinsight.sa')
  const [password, setPassword] = useState('super-secure-password')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      login(email, password)
      navigate('/', { replace: true })
    }, 600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-slate-900/70 ring-1 ring-indigo-500/10 backdrop-blur-xl md:flex-row">
        <div className="relative hidden w-1/2 flex-col justify-between border-r border-slate-800/80 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 p-8 text-indigo-50 md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/20 text-sm font-semibold shadow-md shadow-slate-900/40">
              SI
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                StockInsight Control Plane
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-100/80">
                Super Admin
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <h1 className="text-xl font-semibold leading-tight">
              AI‑driven visibility across every tenant, warehouse and SKU.
            </h1>
            <p className="text-xs text-indigo-100/80">
              Log in to orchestrate subscription plans, monitor revenue, and keep tenant clusters
              healthy with real‑time anomaly detection.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-950/20 p-4 text-[11px] shadow-inner shadow-slate-900/40">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-400/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Predictive restocking
                </span>
                <span className="text-[10px] text-indigo-100/80">
                  3.2M daily SKU events analysed
                </span>
              </div>
              <p className="leading-snug text-indigo-100/80">
                Our multi‑tenant engine keeps noisy data isolated while sharing global demand
                patterns with your AI models.
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between text-[10px] text-indigo-100/60">
            <span>© {new Date().getFullYear()} StockInsight Labs</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Operational · 99.9% Uptime
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-950/80 px-6 py-8 text-slate-50 sm:px-8 md:w-1/2">
          <div className="mx-auto flex h-full max-w-sm flex-col justify-center">
            <div className="mb-7 space-y-2 text-center md:text-left">
              <h2 className="text-xl font-semibold tracking-tight text-slate-50">
                Super Admin Sign in
              </h2>
              <p className="text-xs text-slate-400">
                Use your control‑plane credentials to access tenant, billing and system analytics.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="sa-label text-slate-200">Work email</label>
                <input
                  type="email"
                  required
                  className="sa-input border-slate-800/80 bg-slate-900/70 text-slate-50 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="sa-label mb-0 text-slate-200">Password</label>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  className="sa-input border-slate-800/80 bg-slate-900/70 text-slate-50 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-4 w-7 items-center rounded-full bg-emerald-500/10 px-0.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/60" />
                  </span>
                  <span>Device risk scan enabled</span>
                </div>
                <span>Single sign‑out across tenants</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sa-btn-primary mt-1 w-full justify-center bg-indigo-500 text-sm font-semibold text-white shadow-indigo-500/40 hover:bg-indigo-400"
              >
                {loading ? 'Verifying session…' : 'Enter Super Admin Console'}
              </button>
            </form>

            <div className="mt-6 space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/70 p-3 text-[11px] text-slate-400">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-200">Sandbox credentials</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                  Demo only
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-2">
                <span>
                  Email:{' '}
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-100">
                    superadmin@stockinsight.sa
                  </code>
                </span>
                <span>
                  Password:{' '}
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-100">
                    super-secure-password
                  </code>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

