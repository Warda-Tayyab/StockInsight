import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ReportsSubNav from './ReportsSubNav';

const ReportPageLayout = ({ title, description, children, actions, tenant }) => (
  <div id="report-print-area" className="page-container print:gap-4">

    {/* PRINT HEADER (ONLY FOR PRINT) */}
    <div className="hidden print:block mb-8">
      <div className="border-2 border-slate-300 rounded-lg p-5 bg-white">
        <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-wide">
              {tenant?.name || 'Company Name'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Business Report</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>
              <span className="font-semibold">Generated:</span>{' '}
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
          <div>
            <span className="font-semibold text-slate-700">Owner:</span>{' '}
            <span className="text-slate-900">{tenant?.ownerName || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Contact:</span>{' '}
            <span className="text-slate-900">
              {tenant?.primaryContact?.phone || 'N/A'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-slate-700">Email:</span>{' '}
            <span className="text-slate-900">{tenant?.ownerEmail || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="page-header">
      <div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 text-sm link-primary print:hidden mb-2"
        >
          <FiArrowLeft className="w-4 h-4" />
          Reports home
        </Link>

        <h1 className="page-title">{title}</h1>

        {description && <p className="page-subtitle">{description}</p>}
      </div>

      <div className="print:hidden flex flex-wrap gap-2">{actions}</div>
    </div>

    <div className="print:hidden">
      <ReportsSubNav />
    </div>

    {children}
  </div>
);

export default ReportPageLayout;
