/** @module pos/pages/ReturnExchange */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, RotateCcw, RefreshCw, History, Trash2 } from 'lucide-react';
import returnExchangeService from '../../shared/services/returnExchangeService';
import { usePOSContext } from '../context/POSContext';
import InvoiceBarcodeScanner from '../components/InvoiceBarcodeScanner';

const CONDITION_OPTIONS = [
  { value: 'sellable', label: 'Good — restock', hint: 'Added back to sellable stock' },
  { value: 'damaged', label: 'Damaged — write-off', hint: 'Tracked, not restocked' },
  { value: 'defective', label: 'Defective — write-off', hint: 'Tracked, not restocked' },
];

const resolveConditionFromReason = (reason, policy, current) => {
  if (current && current !== 'sellable') return current;
  if ((policy?.autoWriteOffReasons || []).includes(reason)) return 'damaged';
  return current || 'sellable';
};

const ReturnExchange = () => {
  const [searchParams] = useSearchParams();
  const { products, fetchProducts } = usePOSContext();

  const [mode, setMode] = useState('return');
  const [invoiceInput, setInvoiceInput] = useState('');
  const [sale, setSale] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [returnQty, setReturnQty] = useState({});
  const [returnReasons, setReturnReasons] = useState({});
  const [returnConditions, setReturnConditions] = useState({});
  const [exchangeCart, setExchangeCart] = useState([]);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [collectionMethod, setCollectionMethod] = useState('cash');
  const [amountCollected, setAmountCollected] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([]);
  const [writeOffs, setWriteOffs] = useState([]);
  const [activeTab, setActiveTab] = useState('process');

  useEffect(() => {
    fetchProducts();
    loadHistory();
    loadWriteOffs();
  }, [fetchProducts]);

  const loadHistory = async () => {
    try {
      const res = await returnExchangeService.getHistory(20);
      setHistory(res.data.records || []);
    } catch { /* ignore */ }
  };

  const loadWriteOffs = async () => {
    try {
      const res = await returnExchangeService.getWriteOffs(20);
      setWriteOffs(res.data.records || []);
    } catch { /* ignore */ }
  };

  const applySaleData = (res) => {
    setSale(res.data.sale);
    setPolicy(res.data.policy);
    setRefundMethod(res.data.policy?.defaultRefundMethod || 'cash');
    setCollectionMethod(res.data.policy?.defaultCollectionMethod || 'cash');
    const qtyMap = {};
    const condMap = {};
    res.data.sale.items.forEach((item) => {
      if (item.returnableQty > 0) {
        qtyMap[item.productId] = item.returnableQty;
        condMap[item.productId] = 'sellable';
      }
    });
    setReturnQty(qtyMap);
    setReturnConditions(condMap);
    setReturnReasons({});
    setExchangeCart([]);
    setAmountCollected('');
  };

  const performLookup = async (id, { showSuccessToast = false } = {}) => {
    const trimmed = String(id || '').trim();
    if (!trimmed) return null;

    setLoading(true);
    setSale(null);

    try {
      const res = await returnExchangeService.lookupSale(trimmed);
      applySaleData(res);
      setInvoiceInput(trimmed);
      if (showSuccessToast) {
        toast.success(`Sale loaded: ${trimmed}`);
      }
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sale not found';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const lookupInvoice = async (e) => {
    e?.preventDefault();
    await performLookup(invoiceInput, { showSuccessToast: true });
  };

  const handleReceiptScan = async (scannedCode) => {
    await performLookup(scannedCode);
  };

  useEffect(() => {
    const invoice = searchParams.get('invoice');
    if (invoice) {
      setInvoiceInput(invoice);
      performLookup(invoice).catch(() => {});
    }
  }, [searchParams]);

  const returnSubtotal = useMemo(() => {
    if (!sale) return 0;
  
    return sale.items.reduce((sum, item) => {
      const qty = Number(returnQty[item.productId] || 0);
  
      const originalUnitPrice = Number(item.unitPrice || 0);
      const originalLineTotal = Number(
        item.originalLineTotal || originalUnitPrice * Number(item.quantity || 0)
      );
  
      const discountedLineTotal = Number(
        item.discountedLineTotal ?? item.lineTotal ?? originalLineTotal
      );
  
      const effectiveUnitPrice =
        Number(item.quantity || 0) > 0
          ? discountedLineTotal / Number(item.quantity)
          : originalUnitPrice;
  
      return sum + qty * effectiveUnitPrice;
    }, 0);
  }, [sale, returnQty]);
  const exchangeSubtotal = useMemo(
    () =>
      exchangeCart.reduce(
        (sum, i) => sum + Number(i.product.price || 0) * Number(i.quantity || 0),
        0
      ),
    [exchangeCart]
  );
  const fee = policy ? (returnSubtotal * (policy.restockingFeePercent || 0)) / 100 : 0;
  const returnedNet = returnSubtotal - fee;
  const priceDiff = exchangeSubtotal - returnedNet;

  let settlementType = 'even';
  let amountDue = 0;
  let refundAmount = 0;
  if (mode === 'exchange') {
    if (priceDiff > 0.005) {
      settlementType = 'collect';
      amountDue = Math.round(priceDiff * 100) / 100;
    } else if (priceDiff < -0.005) {
      settlementType = 'refund';
      refundAmount = Math.round(Math.abs(priceDiff) * 100) / 100;
    }
  } else {
    refundAmount = returnedNet;
    settlementType = 'refund';
  }

  const buildItems = () =>
    Object.entries(returnQty)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity: Number(quantity),
        reason: returnReasons[productId] || '',
        condition: returnConditions[productId] || 'sellable',
      }));

  const resetForm = () => {
    setSale(null);
    setInvoiceInput('');
    setReturnQty({});
    setExchangeCart([]);
    setNotes('');
    setAmountCollected('');
  };

  const handleReturn = async () => {
    if (!sale || returnSubtotal <= 0) return;
    setProcessing(true);
    try {
      const res = await returnExchangeService.processReturn({
        saleId: sale._id,
        invoiceId: sale.invoiceId,
        items: buildItems(),
        refundMethod,
        notes,
      });
      const s = res.data.settlement;
      toast.success(
        `Return done — Refund Rs.${s.refundAmount.toFixed(2)} (${s.refundMethod}). ` +
        `Restocked: ${s.restockedCount}, Written-off: ${s.writtenOffCount}`
      );
      resetForm();
      loadHistory();
      loadWriteOffs();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExchange = async () => {
    if (!sale || exchangeCart.length === 0 || returnSubtotal <= 0) {
      toast.error('Select return items and exchange products');
      return;
    }
    if (settlementType === 'collect' && Number(amountCollected) < amountDue - 0.01) {
      toast.error(`Collect Rs.${amountDue.toFixed(2)} from customer`);
      return;
    }
    setProcessing(true);
    try {
      const items = buildItems();
      const res = await returnExchangeService.processExchange({
        saleId: sale._id,
        invoiceId: sale.invoiceId,
        returnedItems: items,
        exchangeItems: exchangeCart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        refundMethod,
        collectionMethod,
        amountCollected: settlementType === 'collect' ? Number(amountCollected) : 0,
        notes,
      });
      const s = res.data.settlement;
      let msg = 'Exchange done — ';
      if (s.settlementType === 'collect') {
        msg += `Collected Rs.${s.amountCollected.toFixed(2)} (${s.collectionMethod})`;
      } else if (s.settlementType === 'refund') {
        msg += `Refunded Rs.${s.refundAmount.toFixed(2)} (${s.refundMethod})`;
      } else {
        msg += 'Even exchange (no payment)';
      }
      msg += `. Restocked: ${s.restockedCount}, Written-off: ${s.writtenOffCount}`;
      toast.success(msg);
      resetForm();
      loadHistory();
      loadWriteOffs();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Exchange failed');
    } finally {
      setProcessing(false);
    }
  };

  const addExchangeItem = (product) => {
    setExchangeCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.stock <= 0) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateReason = (productId, reason) => {
    setReturnReasons((prev) => ({ ...prev, [productId]: reason }));
    setReturnConditions((prev) => ({
      ...prev,
      [productId]: resolveConditionFromReason(reason, policy, prev[productId]),
    }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Returns & Exchanges</h1>
          <p className="page-subtitle">
            Restock good items · Write-off damaged · Collect/refund price difference
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setActiveTab(activeTab === 'history' ? 'process' : 'history')}
            className="btn-secondary">
            <History className="w-4 h-4" /> History
          </button>
          <button type="button" onClick={() => setActiveTab(activeTab === 'writeoffs' ? 'process' : 'writeoffs')}
            className="btn-secondary !border-red-200 !text-red-700 hover:!bg-red-50 hover:!border-red-300">
            <Trash2 className="w-4 h-4" /> Write-offs
          </button>
        </div>
      </div>

    

      {activeTab === 'process' && (
        <>
<div className="input-field h-11 flex-1  disabled:bg-slate-50">

<h3 className="text-lg font-semibold text-slate-900">
    Find Original Receipt
</h3>

<p className="text-sm text-slate-500 mb-5">
    Scan the receipt barcode or enter the invoice ID manually.
</p>

<InvoiceBarcodeScanner
    onInvoiceScanned={handleReceiptScan}
    loading={loading}
/>

<div className="relative flex items-center my-5">
    <div className="flex-1 border-t border-slate-200"></div>

    <span className="px-3 text-xs font-semibold text-slate-400 bg-white">
        OR
    </span>

    <div className="flex-1 border-t border-slate-200"></div>
</div>

<form onSubmit={lookupInvoice} className="flex flex-col md:flex-row gap-3">

    <div className="relative flex-1">

        <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        />

        <input
            type="text"
            placeholder="Enter Invoice ID (INV-000001)"
            value={invoiceInput}
            onChange={(e)=>setInvoiceInput(e.target.value)}
            className="input-field pl-11"
        />

    </div>

    <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full sm:w-[135px] h-11 shrink-0 flex items-center justify-center"
    >
        {loading ? "Searching..." : "Find Sale"}
    </button>

</form>

</div>

          {sale && (
            <>
              {Boolean(sale.hasCoupon || sale.couponCode || (sale.couponDiscountAmount && Number(sale.couponDiscountAmount) > 0)) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex items-center justify-between">
                  <div>
                    <span className="font-bold">⚠️ Coupon Sale Detected</span>
                    <p className="text-xs text-amber-800 m-0 mt-0.5">
                      This sale was made using coupon <strong>{sale.couponCode || 'Coupon Applied'}</strong>.
                      {((mode === 'return' && !policy?.allowCouponSaleReturns) || (mode === 'exchange' && !policy?.allowCouponSaleExchanges)) && (
                        <span className="text-red-700 font-semibold block mt-1">
                          🚫 Policy Restriction: {mode === 'exchange' ? 'Exchanges' : 'Returns'} on coupon sales are disabled in settings.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setMode('return')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                    mode === 'return' ? 'btn-primary' : 'btn-secondary'
                  }`}>
                  <RotateCcw className="w-4 h-4" /> Return
                </button>
                <button type="button" onClick={() => setMode('exchange')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                    mode === 'exchange' ? 'btn-primary' : 'btn-secondary'
                  }`}>
                  <RefreshCw className="w-4 h-4" /> Exchange
                </button>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 m-0">{sale.invoiceId}</p>
                    <p className="text-xs text-slate-500 m-0">
                      {new Date(sale.createdAt).toLocaleString()} · {sale.returnStatus}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900 m-0">Rs.{(sale.total || 0).toFixed(2)}</p>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <p className="form-label m-0">Return items</p>
                  {sale.items.map((item) => (
                    <div key={item.productId}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 py-2 border-b border-slate-100 items-center">
                      <div className="md:col-span-4">
  <p className="text-sm font-medium text-slate-900 m-0">
    {item.productName}
  </p>

  <p className="text-xs text-slate-500 m-0">
  Sold {item.quantity} · Returnable {item.returnableQty} · Rs.
  {(
    Number(item.discountedLineTotal ?? item.lineTotal ?? item.originalLineTotal ?? (item.unitPrice * item.quantity)) /
    Number(item.quantity || 1)
  ).toFixed(2)}
  {' per item'}
</p>

  {Number(item.discountAmount || 0) > 0 ||
  Number(item.discountPercentage || 0) > 0 ||
  Number(item.discountValue || 0) > 0 ||
  (
    Number(item.originalLineTotal || 0) >
    Number(item.discountedLineTotal || item.lineTotal || 0)
  ) ? (
    <p className="text-xs text-amber-600 font-medium mt-1">
      Discounted product
    </p>
  ) : null}
</div>
                      <input type="number" min={0} max={item.returnableQty}
                        value={returnQty[item.productId] || 0}
                        onChange={(e) => setReturnQty((prev) => ({
                          ...prev,
                          [item.productId]: Math.min(item.returnableQty, Number(e.target.value)),
                        }))}
                        className="md:col-span-1 input-field !py-1.5" />
                      <select value={returnReasons[item.productId] || ''}
                        onChange={(e) => updateReason(item.productId, e.target.value)}
                        className="md:col-span-3 select-field !py-1.5">
                        <option value="">Reason</option>
                        {(policy?.allowedReasons || []).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <select value={returnConditions[item.productId] || 'sellable'}
                        onChange={(e) => setReturnConditions((prev) => ({
                          ...prev, [item.productId]: e.target.value,
                        }))}
                        className="md:col-span-4 select-field !py-1.5">
                        {CONDITION_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {mode === 'exchange' && (
                <div className="card-padded">
                  <p className="form-label mb-3">New items (exchange)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {products.filter((p) => p.stock > 0).map((p) => (
                      <button key={p.id} type="button" onClick={() => addExchangeItem(p)}
                        className="text-left p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm transition-colors">
                        <p className="font-medium text-slate-900 m-0 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 m-0">Rs.{p.price} · {p.stock} in stock</p>
                      </button>
                    ))}
                  </div>
                  {exchangeCart.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-700">
                      {exchangeCart.map((i) => (
                        <p key={i.product.id} className="m-0 py-1">
                          {i.product.name} × {i.quantity} = Rs.{(i.product.price * i.quantity).toFixed(2)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settlement panel */}
              <div className="card-padded bg-slate-50/80 text-sm space-y-2">
                <p className="font-semibold text-slate-900 m-0">Payment settlement</p>
                <div className="flex justify-between text-slate-700"><span>Return credit</span><span>Rs.{returnSubtotal.toFixed(2)}</span></div>
                {fee > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Restocking fee</span><span>-Rs.{fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700"><span>Net return value</span><span>Rs.{returnedNet.toFixed(2)}</span></div>
                {mode === 'exchange' && (
                  <div className="flex justify-between text-slate-700"><span>New items total</span><span>Rs.{exchangeSubtotal.toFixed(2)}</span></div>
                )}

                {mode === 'exchange' && settlementType === 'collect' && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="font-semibold text-indigo-900 m-0 mb-2">
                      Customer pays extra: Rs.{amountDue.toFixed(2)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <select value={collectionMethod} onChange={(e) => setCollectionMethod(e.target.value)}
                        className="select-field w-auto">
                        {(policy?.collectionMethods || ['cash', 'card']).map((m) => (
                          <option key={m} value={m}>Collect via {m}</option>
                        ))}
                      </select>
                      <input type="number" step="0.01" min={amountDue} placeholder={`Amount collected (Rs.${amountDue})`}
                        value={amountCollected}
                        onChange={(e) => setAmountCollected(e.target.value)}
                        className="input-field flex-1 w-full min-w-0 sm:min-w-[160px]" />
                    </div>
                  </div>
                )}

                {settlementType === 'refund' && refundAmount > 0 && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="font-semibold text-emerald-900 m-0 mb-2">
                      {mode === 'exchange' ? 'Customer gets refund' : 'Refund to customer'}: Rs.{refundAmount.toFixed(2)}
                    </p>
                    <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}
                      className="select-field w-auto">
                      {(policy?.refundMethods || ['cash']).map((m) => (
                        <option key={m} value={m}>{m.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                )}

                {mode === 'exchange' && settlementType === 'even' && (
                  <p className="text-slate-600 m-0">Even exchange — no extra payment needed</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <input type="text" placeholder="Notes (optional)" value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field flex-1 w-full min-w-0 sm:min-w-[200px]" />
                <button type="button" onClick={mode === 'return' ? handleReturn : handleExchange}
                  disabled={processing || returnSubtotal <= 0}
                  className="btn-primary px-6 disabled:opacity-50">
                  {processing ? 'Processing...' : mode === 'return' ? 'Complete Return' : 'Complete Exchange'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 font-semibold text-sm text-slate-900">Recent returns & exchanges</div>
          <div className="divide-y divide-slate-100">
            {history.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 m-0">No records</p>
            ) : history.map((r) => (
              <div key={r._id} className="px-4 py-3 flex justify-between text-sm gap-4">
                <div>
                  <p className="font-medium text-slate-900 m-0">{r.referenceId} · {r.type}</p>
                  <p className="text-xs text-slate-500 m-0">
                    {r.originalInvoiceId} · Restocked {r.restockedCount || 0} · Written-off {r.writtenOffCount || 0}
                  </p>
                </div>
                <span className="font-medium text-slate-800 text-right">
                  {r.settlementType === 'collect' && `Collected Rs.${(r.amountCollected || 0).toFixed(2)}`}
                  {r.settlementType === 'refund' && `Refund Rs.${(r.refundAmount || 0).toFixed(2)}`}
                  {r.settlementType === 'even' && 'Even'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'writeoffs' && (
        <div className="card overflow-hidden border-red-200">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 font-semibold text-sm text-red-800">
            Written-off items (not in sellable stock)
          </div>
          <div className="divide-y divide-slate-100">
            {writeOffs.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 m-0">No write-offs yet</p>
            ) : writeOffs.map((w) => (
              <div key={w._id} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-900 m-0">
                  {w.productName} × {w.quantity} — {w.condition}
                </p>
                <p className="text-xs text-slate-500 m-0">
                  {w.referenceId} · {w.originalInvoiceId} · {w.reason} · Rs.{(w.lineValue || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnExchange;
