/** @module shared/components/Navbar */

import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, user } = useAuthContext();

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    navigate('/auth/login');
  };

  return (
    <nav data-testid="navbar" className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="navbar-search">
            <span className="navbar-search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search products, inventory..." 
              className="navbar-search-input"
            />
          </div>
        </div>
        
        <div className="navbar-right">
          <button className="navbar-icon-btn" title="Notifications">
            <span>🔔</span>
            <span className="navbar-badge">3</span>
          </button>
          
          <div className="navbar-user">
            <div className="navbar-user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.email || 'User'}</span>
              <span className="navbar-user-role">Admin</span>
            </div>
          </div>
          
          <button 
            className="btn btn-secondary btn-sm" 
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
