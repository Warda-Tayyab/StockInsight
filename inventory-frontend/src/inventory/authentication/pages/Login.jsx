/** @module inventory/authentication/pages/Login */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '../../../shared/context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated, isAuthenticated } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: '',
      general: '',
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.slug.trim()) {
      newErrors.slug = 'Company slug is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors); 
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errorField) {
          setErrors({ [data.errorField]: data.message });
        } else {
          setErrors({ general: data.message });
        }
        setLoading(false);
        return;
      }
      

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err); 
      setErrors({ general: 'Server error. Try again.' });
      setLoading(false);
    }
  };
  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8 text-white">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-5xl">📊</span>
            <h1 className="text-3xl text-white m-0">StockInsight</h1>
          </div>
          <p className="text-white/90 text-sm m-0">AI-Driven Inventory Insights</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl mb-2 text-center">Welcome Back</h2>
          <p className="text-center text-gray-600 mb-8 text-sm">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.general && (
              <div className="text-red-500 mb-3">{errors.general}</div>
            )}
              <div className="mb-4">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-2">
                Company Slug
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg"
                placeholder="your-company"
                value={formData.slug}
                onChange={handleChange}
                
              />
            </div>
            {errors.slug && <p className="text-red-500 text-sm mb-3">{errors.slug}</p>}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mb-3">{errors.email}</p>}

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm mb-3">{errors.password}</p>}

            <div className="flex items-center justify-between text-sm mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:underline">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center text-center my-8 text-gray-400 text-sm">
            <div className="flex-1 border-b border-gray-200"></div>
            <span className="px-4">Or continue with</span>
            <div className="flex-1 border-b border-gray-200"></div>
          </div>

          <div className="flex gap-4 mb-6">
            <button className="flex-1 bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <span>🔵</span>
              Google
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <span>⚫</span>
              GitHub
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 m-0">
            Don't have an account? <a href="#" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
