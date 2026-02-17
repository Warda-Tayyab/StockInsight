/** @module inventory/reporting/pages/Reports */

import { Link } from 'react-router-dom';

const Reports = () => {
  const reportTypes = [
    {
      id: 1,
      title: 'Sales Report',
      description: 'View sales trends, revenue, and performance metrics',
      icon: '📈',
      link: '/reports/sales',
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 2,
      title: 'Stock Report',
      description: 'Analyze inventory levels, turnover rates, and stock movements',
      icon: '📦',
      link: '/reports/stock',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 3,
      title: 'Product Performance',
      description: 'Track product sales, popularity, and profitability',
      icon: '⭐',
      link: '/reports',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      id: 4,
      title: 'Batch Analysis',
      description: 'Monitor batch usage, expiry dates, and turnover',
      icon: '🔍',
      link: '/reports',
      color: 'bg-blue-100 text-blue-600',
    },
  ];

  const recentReports = [
    { id: 1, name: 'Monthly Sales Report - March 2024', type: 'Sales', date: '2024-03-31', status: 'completed' },
    { id: 2, name: 'Stock Level Report - Q1 2024', type: 'Stock', date: '2024-03-31', status: 'completed' },
    { id: 3, name: 'Low Stock Alert Report', type: 'Alerts', date: '2024-04-01', status: 'completed' },
  ];

  return (
    <div data-testid="reports-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600 text-sm m-0">Generate and view inventory reports</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Generate Custom Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => (
          <Link key={report.id} to={report.link} className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-4 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg text-inherit no-underline">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${report.color}`}>
              {report.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 m-0">{report.title}</h3>
            <p className="text-sm text-gray-600 m-0 flex-1">{report.description}</p>
            <span className="text-sm text-blue-600 font-medium">View Report →</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md mt-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 m-0">Recent Reports</h3>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700">View all</a>
        </div>
        
        <div className="flex flex-col gap-4">
          {recentReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-gray-50">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 m-0 mb-1">{report.name}</h4>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{report.type}</span>
                  <span className="text-xs text-gray-400">{report.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">View</button>
                <button className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
