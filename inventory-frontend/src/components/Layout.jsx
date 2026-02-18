/** @module components/Layout - Dashboard layout wrapper */

import { useState } from 'react';
import Navbar from '../shared/components/Navbar';
import Sidebar from '../shared/components/Sidebar';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div data-testid="layout" className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
