/** @module components/Layout - Dashboard layout wrapper */

import { useState, useEffect } from 'react';
import Navbar from '../shared/components/Navbar';
import Sidebar from '../shared/components/Sidebar';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div data-testid="layout" className="flex min-h-dvh bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'}`}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 w-full min-w-0 p-3 sm:p-5 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[1600px] mx-auto min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
