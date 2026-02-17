/** @module shared/components/Sidebar */

import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

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
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
    >
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <h2>StockInsight</h2>
            <span className="sidebar-subtitle">AI Inventory</span>
          </div>
        )}
        {collapsed && <div className="sidebar-logo-icon">📊</div>}
        <button 
          className="sidebar-toggle" 
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path || 
            (path !== '/dashboard' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : ''}
            >
              <span className="sidebar-icon">{icon}</span>
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </Link>
          );
        })}
      </nav>
      
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            <p className="text-xs text-secondary">AI-Driven Inventory</p>
            <p className="text-xs text-tertiary">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
