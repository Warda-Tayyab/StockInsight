/** @module inventory/settings/pages/NotificationSettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import settingsService from '../../../shared/services/settingsService';

const defaults = {
  lowStockInApp: true,
  lowStockEmail: false,
  salesInApp: true,
  salesEmail: false,
};

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getProfile()
      .then((res) => setPrefs({ ...defaults, ...(res.data.data.notificationPrefs || {}) }))
      .catch(() => toast.error('Failed to load preferences'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsService.updateNotifications(prefs);
      setPrefs({ ...defaults, ...res.data.data });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading…</div>;

  const rows = [
    { key: 'lowStockInApp', label: 'Low stock — in-app', hint: 'Bell notifications in the navbar' },
    { key: 'lowStockEmail', label: 'Low stock — email', hint: 'Email when stock hits reorder level' },
    { key: 'salesInApp', label: 'Sales alerts — in-app', hint: 'Notify on notable POS activity' },
    { key: 'salesEmail', label: 'Sales alerts — email', hint: 'Daily/important sales email alerts' },
  ];

  return (
    <form onSubmit={save} className="card-padded flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-500">Control in-app and email alerts</p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(({ key, label, hint }) => (
          <label key={key} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 accent-indigo-600"
              checked={!!prefs[key]}
              onChange={() => toggle(key)}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">{label}</span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
};

export default NotificationSettings;
