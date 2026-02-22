'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import type { AuthUser, ApiError, AdminData } from '@/types/super-admin';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const initRef = useRef(false);
  const lastValidationRef = useRef<number>(0);

  const validateToken = useCallback(async (token: string, skipAPICall: boolean = false): Promise<{ isValid: boolean; userData?: AuthUser }> => {
    try {
      // Skip API validation if token was validated recently (within 5 minutes)
      const now = Date.now();
      const VALIDATION_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
      
      if (skipAPICall || (now - lastValidationRef.current < VALIDATION_CACHE_TIME)) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser) as AuthUser;
            return { isValid: true, userData };
          } catch {
            // Invalid stored user data, fallback to API call
          }
        }
        
        if (skipAPICall) {
          return { isValid: false };
        }
      }

      // Only make API call when necessary and not rate limited
      const response = await axiosInstance.get('/v1/super-admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        lastValidationRef.current = now;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser) as AuthUser;
          return { isValid: true, userData };
        }
        return { 
          isValid: true, 
          userData: { 
            id: 'super_admin', 
            email: 'admin@tickflo.com', 
            name: 'Super Administrator', 
            role: 'super_admin' 
          } 
        };
      }
      return { isValid: false };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Token validation failed:', apiError);
      
      // If rate limited, skip API calls for a while but trust stored data
      if (apiError.response?.status === 429) {
        const storedUser = localStorage.getItem('user');
        if (storedUser && token) {
          try {
            const userData = JSON.parse(storedUser) as AuthUser;
            return { isValid: true, userData };
          } catch {
            // Invalid stored user data
          }
        }
      }
      
      return { isValid: false };
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          // If we have both token and user data, try to use cached validation first
          try {
            const userData = JSON.parse(storedUser) as AuthUser;
            setIsAuthenticated(true);
            setUser(userData);
            
            // Validate token in background, but don't block UI
            validateToken(token, true).then(({ isValid }) => {
              if (!isValid) {
                // Only clear auth if validation definitively fails (not rate limited)
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
                if (window.location.pathname !== '/login') {
                  router.push('/login');
                }
              }
            }).catch(() => {
              // Silently fail background validation
            });
            
            return;
          } catch {
            // Invalid stored user data, fallback to full validation
          }
        }
        
        if (token) {
          const { isValid, userData } = await validateToken(token, false);
          if (isValid && userData) {
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setUser(null);
            if (window.location.pathname !== '/login') {
              router.push('/login');
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          if (window.location.pathname !== '/login') {
            router.push('/login');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, validateToken]);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  const login = async (token: string, adminData?: AdminData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      
      // If we have admin data from login response, store it
      if (adminData) {
        const userData: AuthUser = {
          id: adminData.id || 'super_admin',
          email: adminData.email || adminData.emailAddress || 'admin@tickflo.com',
          name: adminData.fullName || adminData.name || 'Super Administrator',
          role: adminData.role || 'super_admin'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        router.push('/');
        return;
      }
      
      // Only validate token if we don't have admin data
      try {
        const { isValid, userData } = await validateToken(token, false);
        if (isValid) {
          setIsAuthenticated(true);
          if (userData) {
            setUser(userData);
          }
          router.push('/');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          throw new Error('Invalid token received from server');
        }
      } catch (error: unknown) {
        const apiError = error as ApiError;
        // If validation fails due to rate limiting but we have the login token, proceed anyway
        if (apiError.response?.status === 429) {
          setIsAuthenticated(true);
          // Set default user data
          const defaultUserData: AuthUser = {
            id: 'super_admin',
            email: 'admin@tickflo.com',
            name: 'Super Administrator',
            role: 'super_admin'
          };
          localStorage.setItem('user', JSON.stringify(defaultUserData));
          setUser(defaultUserData);
          router.push('/');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          throw error;
        }
      }
    }
  };

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const redirectToLogin = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      logout();
    }
  }, [logout]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    redirectToLogin,
    refreshAuth: checkAuth
  };
};