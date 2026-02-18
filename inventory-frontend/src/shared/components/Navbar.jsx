/** @module shared/components/Navbar */

import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, user } = useAuthContext();

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    navigate('/auth/login');
  };

  return (
    <nav data-testid="navbar" className="bg-white border-b border-gray-200 px-8 h-[70px] flex items-center shadow-sm sticky top-0 z-40">
      <div className="w-full flex items-center justify-between gap-6">
        <div className="flex-1 max-w-[500px]">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 text-base">🔍</span>
            <input 
              type="text" 
              placeholder="Search products, inventory..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm transition-all focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative bg-transparent border-none w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-xl hover:bg-gray-100" title="Notifications">
            <span>🔔</span>
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">3</span>
          </button>
          
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 leading-tight">{user?.email || 'User'}</span>
              <span className="text-xs text-gray-400 leading-tight">Admin</span>
            </div>
          </div>
          
          <button 
            className="bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
