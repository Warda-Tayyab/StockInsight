import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((token, adminData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token || 'mock-token');
    const userData = adminData ? {
      id: adminData.id || 'super_admin',
      email: adminData.email || adminData.emailAddress || 'admin@tickflo.com',
      name: adminData.fullName || adminData.name || 'Super Administrator',
      role: adminData.role || 'super_admin'
    } : {
      id: 'super_admin',
      email: 'admin@tickflo.com',
      name: 'Super Administrator',
      role: 'super_admin'
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate('/dashboard');
  }, [navigate]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    redirectToLogin: logout,
    refreshAuth: checkAuth
  };
}
