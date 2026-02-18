/** @module shared/components/Sidebar */

import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/inventory', label: 'Inventory', icon: '📋' },
    { path: '/batch-tracking', label: 'Batch Tracking', icon: '🔍' },
    { path: '/ai-query', label: 'AI Query', icon: '🤖' },
    { path: '/stock-alerts', label: 'Stock Alerts', icon: '⚠️' },
    { path: '/low-stock', label: 'Low Stock', icon: '📉' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/insights', label: 'Insights', icon: '💡' },
  ];

  return (
    <aside 
      data-testid="sidebar" 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 shadow-sm ${collapsed ? 'w-20' : 'w-[260px]'}`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between min-h-[80px]">
        {!collapsed ? (
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-blue-600">StockInsight</h2>
            <span className="text-xs text-gray-500 font-medium">AI Inventory</span>
          </div>
        ) : (
          <div className="text-2xl text-center w-full">📊</div>
        )}
        <button 
          className="bg-gray-100 border border-gray-200 rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer transition-colors text-gray-600 hover:bg-gray-200 hover:text-gray-900 text-base"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto flex flex-col gap-1">
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path || 
            (path !== '/dashboard' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center p-4' : ''}`}
              title={collapsed ? label : ''}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">AI-Driven Inventory</p>
            <p className="text-xs text-gray-400">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
