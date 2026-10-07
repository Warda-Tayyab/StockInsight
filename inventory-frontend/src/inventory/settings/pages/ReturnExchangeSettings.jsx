/** @module inventory/settings/pages/ReturnExchangeSettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import returnExchangeService from '../../../shared/services/returnExchangeService';

const ReturnExchangeSettings = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    returnExchangeService.getPolicy()
      .then((res) => setPolicy(res.data.policy))
      .catch(() => toast.error('Failed to load policy'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setPolicy((prev) => ({ ...prev, [field]: value }));
  };

  const toggleListItem = (field, item) => {
    setPolicy((prev) => {
      const list = prev[field] || [];
      const next = list.includes(item) ? list.filter((m) => m !== item) : [...list, item];
      return { ...prev, [field]: next.length ? next : list };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await returnExchangeService.updatePolicy(policy);
      setPolicy(res.data.policy);
      toast.success('Policy saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSave} className="card-padded flex flex-col gap-7 w-full">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Return &amp; Exchange Policy</h2>
          <p className="text-sm text-slate-500 mt-1">
            Windows, fees, payment methods, and damaged-item handling
          </p>
        </div>
        <section className="border-l-4 border-indigo-500 pl-5 py-2">
          <h2 className="card-title mb-4 text-lg text-slate-900">Features</h2>
          <div className="flex flex-col gap-4">
            {[
              ['returnsEnabled', 'Allow product returns'],
              ['exchangesEnabled', 'Allow product exchanges'],
              ['allowDiscountedProductReturns', 'Allow discounted products return'],
              ['allowDiscountedProductExchanges', 'Allow discounted products exchange'],
              ['allowCouponSaleReturns', 'Allow returns on coupon sales'],
              ['allowCouponSaleExchanges', 'Allow exchanges on coupon sales'],
              ['requireReceipt', 'Require invoice for lookup'],
              ['allowPartialReturn', 'Allow partial returns'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={policy[key]}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="border-l-4 border-emerald-500 pl-5 py-2">
          <h2 className="card-title mb-4 text-lg text-slate-900">Policy Windows & Fees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Return window (days)</label>
              <input type="number" min={0} max={365} value={policy.returnWindowDays}
                onChange={(e) => handleChange('returnWindowDays', Number(e.target.value))}
                className="input-field" />
              <p className="text-xs text-slate-500 mt-2 font-medium">0 = no time limit</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Exchange window (days)</label>
              <input type="number" min={0} max={365} value={policy.exchangeWindowDays}
                onChange={(e) => handleChange('exchangeWindowDays', Number(e.target.value))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Restocking fee (%)</label>
              <input type="number" min={0} max={100} value={policy.restockingFeePercent}
                onChange={(e) => handleChange('restockingFeePercent', Number(e.target.value))}
                className="input-field" />
              <p className="text-xs text-slate-500 mt-2 font-medium">Applied to returns</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Tax rate (%)</label>
              <input type="number" min={0} max={100} value={policy.taxRatePercent || 0}
                onChange={(e) => handleChange('taxRatePercent', Number(e.target.value))}
                className="input-field" />
            </div>
           
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Tax label</label>
              <input type="text" value={policy.taxLabel || ''}
                onChange={(e) => handleChange('taxLabel', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Working hours</label>
              <input type="text" value={policy.workingHours || ''}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Friday working hours</label>
              <input type="text" value={policy.workingHoursFriday || ''}
                onChange={(e) => handleChange('workingHoursFriday', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Exchange pricing</label>
              <select value={policy.exchangePricePolicy}
                onChange={(e) => handleChange('exchangePricePolicy', e.target.value)}
                className="input-field">
                <option value="current_price">Current selling price</option>
                <option value="same_price">Original sale price</option>
              </select>
            </div>
          </div>
        </section>

        <section className="border-l-4 border-blue-500 pl-5 py-2">
          <h2 className="card-title mb-4 text-lg text-slate-900">Payment Methods</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3 text-slate-900">Refund methods (when customer gets money back)</label>
              <div className="flex flex-wrap gap-4">
                {['cash', 'card', 'store_credit'].map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-lg transition">
                    <input type="checkbox" checked={(policy.refundMethods || []).includes(m)}
                      onChange={() => toggleListItem('refundMethods', m)} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm font-medium capitalize text-slate-700">{m.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              {(policy.refundMethods || []).length > 0 && (
                <select value={policy.defaultRefundMethod}
                  onChange={(e) => handleChange('defaultRefundMethod', e.target.value)}
                  className="select-field mt-3">
                  {(policy.refundMethods || []).map((m) => (
                    <option key={m} value={m}>Default refund: {m.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-sm font-semibold mb-3 text-slate-900">Collection methods (when customer pays extra on exchange)</label>
              <div className="flex flex-wrap gap-4">
                {['cash', 'card'].map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-lg transition">
                    <input type="checkbox" checked={(policy.collectionMethods || []).includes(m)}
                      onChange={() => toggleListItem('collectionMethods', m)} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm font-medium capitalize text-slate-700">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-l-4 border-amber-500 pl-5 py-2">
          <h2 className="card-title mb-4 text-lg text-slate-900">Return Reasons</h2>
          <label className="block text-sm font-semibold mb-2 text-slate-900">Allowed return reasons (one per line)</label>
          <textarea rows={4} value={(policy.allowedReasons || []).join('\n')}
            onChange={(e) => handleChange('allowedReasons', e.target.value.split('\n').map((r) => r.trim()).filter(Boolean))}
            className="input-field"
            placeholder="e.g. Changed mind&#10;Defective&#10;Wrong item..." />
        </section>

        <section className="bg-gradient-to-br from-red-50 to-red-25 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="border-l-4 border-red-500 pl-4">
            <label className="block text-sm font-bold text-red-900 mb-2">
              Write-off Reasons (Damaged Items)
            </label>
            <p className="text-xs text-red-800 mb-3 font-medium">
              Items marked with these reasons are tracked as written-off inventory — stock is NOT restored to inventory levels.
            </p>
          </div>
          <textarea rows={3} value={(policy.autoWriteOffReasons || []).join('\n')}
            onChange={(e) => handleChange('autoWriteOffReasons', e.target.value.split('\n').map((r) => r.trim()).filter(Boolean))}
            className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-sm bg-white font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition" 
            placeholder="e.g. Damaged in transit&#10;Not usable&#10;Manufacturer defect..." />
        </section>

        <section className="border-l-4 border-violet-500 pl-5 py-2">
          <h2 className="card-title mb-4 text-lg text-slate-900">Receipt Message</h2>
          <label className="block text-sm font-semibold mb-2 text-slate-900">Receipt policy text</label>
          <textarea rows={3} value={policy.policyNotes || ''}
            onChange={(e) => handleChange('policyNotes', e.target.value)}
            className="input-field"
            placeholder="e.g. Returns and exchanges require the original invoice and intact packaging." />
          <p className="text-xs text-slate-500 mt-2 font-medium">This text will appear on customer receipts.</p>
        </section>

        <section className="border-l-4 border-fuchsia-500 pl-5 py-2">
          <h2 className="card-title mb-4 text-lg text-slate-900">Receipt Footer</h2>
          <label className="block text-sm font-semibold mb-2 text-slate-900">Custom footer message</label>
          <textarea rows={3} value={policy.receiptFooterMessage || ''}
            onChange={(e) => handleChange('receiptFooterMessage', e.target.value)}
            className="input-field"
            placeholder="Add a custom message for every receipt footer" />
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-100">
          <button type="submit" disabled={saving}
            className="btn-primary disabled:opacity-50 px-6">
            {saving ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : 'Save Policy'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnExchangeSettings;
