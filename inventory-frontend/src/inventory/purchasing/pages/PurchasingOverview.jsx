import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineReceiptTax,
  HiOutlineSwitchHorizontal,
  HiOutlineRefresh,
} from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';

const cards = [
  {
    to: '/purchasing/vendors',
    title: 'Suppliers',
    desc: 'Suppliers you purchase goods from',
    icon: HiOutlineUsers,
  },
  {
    to: '/purchasing/orders',
    title: 'Purchase Orders',
    desc: 'Place purchase orders for the Store or Warehouse',
    icon: HiOutlineDocumentText,
  },
  {
    to: '/purchasing/receive',
    title: 'Purchase Receive',
    desc: 'Receive goods and automatically increase stock with batch and source tracking',
    icon: HiOutlineClipboardList,
  },
  {
    to: '/purchasing/returns',
    title: 'Purchase Returns',
    desc: 'Return goods to suppliers and deduct from batch & inventory stock',
    icon: HiOutlineRefresh,
  },
  {
    to: '/purchasing/bills',
    title: 'Bills',
    desc: 'Manage supplier invoices and payments',
    icon: HiOutlineReceiptTax,
  },
  {
    to: '/purchasing/transfers',
    title: 'Stock Transfer',
    desc: 'Transfer stock from Warehouse to Store (optional for larger businesses)',
    icon: HiOutlineSwitchHorizontal,
  },
];

const PurchasingOverview = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    purchaseService
      .getSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="page-container" data-testid="purchasing-overview">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchasing</h1>
          <p className="page-subtitle">
            Purchase → Receive → Stock increases. Small shops can receive
            directly into the Store, while larger businesses can use
            Warehouse + Transfer. Return goods back to suppliers with Purchase Returns.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Link
            to="/purchasing/receive/new"
            className="btn-primary no-underline w-full sm:w-auto justify-center"
          >
            Quick Receive
          </Link>
          <Link
            to="/purchasing/returns/new"
            className="btn-secondary no-underline w-full sm:w-auto justify-center"
          >
            Return Purchase
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {[
          ['Active Suppliers', summary?.vendors],
          ['Open POs', summary?.openPos],
          ['Total Receipts', summary?.totalPurchasesCount ?? summary?.receipts],
          [
            "Today's Purchases",
            summary?.todaysPurchasesCount != null
              ? `${summary.todaysPurchasesCount} (Rs ${(summary.todaysPurchasedAmount || 0).toLocaleString()})`
              : '—',
          ],
          ['Returns Posted', summary?.returns],
          ['Unpaid Bills', summary?.unpaidBills],
        ].map(([label, value]) => (
          <div key={label} className="card-padded text-center">
            <p className="text-xs text-slate-500 font-semibold uppercase m-0">
              {label}
            </p>
            <p className="text-base sm:text-lg font-bold text-slate-900 m-0 mt-1 break-words">
              {value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ to, title, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card-padded hover:ring-2 hover:ring-indigo-200 transition no-underline text-inherit"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 m-0">
                  {title}
                </h2>
                <p className="text-sm text-slate-500 m-0 mt-1">
                  {desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card-padded mt-2">
        <h3 className="text-sm font-semibold text-slate-800 m-0 mb-2">
          Suggested Flow
        </h3>

        <ol className="text-sm text-slate-600 m-0 pl-5 space-y-1">
          <li>
            <strong>Small Shop:</strong> Supplier → Quick Receive
            (Location = Store) → Stock ready for POS
          </li>

          <li>
            <strong>Large Business:</strong> Supplier → PO (Warehouse) →
            Receive → Optional Transfer to Store → Bill
          </li>

          <li>
            <strong>Returns:</strong> Use Purchase Returns to return damaged or defective stock to suppliers, automatically updating batch tracking.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default PurchasingOverview;