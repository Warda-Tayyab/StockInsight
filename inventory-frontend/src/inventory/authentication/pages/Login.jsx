/** @module inventory/authentication/pages/Login */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react'; // make sure lucide-react is installed
import { GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import api from '../../../shared/utils/api';
import { Brain } from 'lucide-react';
import { Database, BarChart3 } from 'lucide-react';
const Login = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated, isAuthenticated } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

const handleGoogleSuccess = async (credentialResponse) => {
  console.log("Google Token:", credentialResponse.credential);

  if (!formData.slug.trim()) {
    setErrors({
      slug: 'Company slug is required for Google login',
      general: 'Please enter your Company Slug first',
    });
    return;
  }

  // Decode token (optional)
  const decoded = jwt_decode(credentialResponse.credential);
  console.log("Decoded Google User:", decoded);

  // Send to backend
  try {
    const res = await api.post('/api/users/auth/google-login', {
      token: credentialResponse.credential,
      slug: formData.slug.trim(),
    });

    const data = res.data;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    navigate('/dashboard');

  } catch (err) {
    console.error('Google login error:', err);
    setErrors({ general: err.response?.data?.message || 'Google login failed' });
  }
};

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
  setErrors({});

  try {
    const res = await api.post('/api/users/auth/login', {
      ...formData,
      slug: formData.slug.trim(),
    });
  
    const data = res.data;
  
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  
    setUser(data.user);
    setIsAuthenticated(true);
  
    navigate('/dashboard');
    
  } catch (err) {
    console.error('Login error:', err);
  
    const status = err.response?.status;
    const data = err.response?.data;
  
    // 🔴 Activation required
    if (status === 403 && data?.errorField === 'activation') {
      navigate('/auth/activate', {
        state: { email: formData.email, slug: formData.slug }
      });
      return;
    }
  
    // 🔴 Normal validation errors
    if (data?.errorField) {
      setErrors({ [data.errorField]: data.message });
    } else {
      setErrors({ general: data?.message || 'Login failed' });
    }
  
    setLoading(false);
  }
};
  return (
  <div
    data-testid="login-page"
     className="h-screen flex bg-white overflow-hidden"
  >
    {/* LEFT SIDE */}

  <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 flex-col justify-between text-white overflow-hidden">
  <div>
  <div className="flex items-center gap-3 mb-12 animate-slide-up">
  <img
    src="/stockinsight-logo.jpg"
    alt="StockInsight Logo"
    className="w-15 h-15 object-contain rounded-xl"
  />

  <h1 className="text-4xl font-bold">
    StockInsight
  </h1>
</div>
<h2 className="text-4xl sm:text-5xl font-bold leading-tight animate-slide-up delay-1">
    Manage your
  <span className="block text-cyan-300">
    inventory
  </span>
  smarter.
</h2>

<p className="mt-8 text-xl text-white/80 max-w-lg animate-slide-up delay-2">
  Track stock levels, monitor warehouses, manage stock movement,
  and gain AI-powered insights for smarter business decisions.
</p>


  </div>

  <div className="flex gap-6 mt-4">
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl w-56 animate-slide-up delay-3 hover:-translate-y-2 transition-all duration-300">
<Brain size={32} className="text-cyan-300 mb-4" />

  <h3 className="font-semibold text-xl mb-3 text-white">
    RAG System
  </h3>

  <p className="text-white/70">
            Retrieve relevant knowledge and generate accurate AI-powered responses from your data.

  </p>
</div>
<div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl w-64 animate-slide-up delay-4 hover:-translate-y-2 transition-all duration-300">
<BarChart3 size={32} className="text-cyan-300 mb-4" />

  <h3 className="font-semibold text-xl mb-3 text-white">
    Analytics 
  </h3>

  <p className="text-white/70">
  Generate detailed reports and forecast inventory trends using intelligent data analysis.

  </p>
</div>


  </div>

</div>

{/* RIGHT SIDE */}
<div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-gray-50">
  <div className="w-full max-w-md">

    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 md:p-10">

      {/* Header */}
      <div className="text-center mb-8">

       

         <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome To StockInsights
        </h2>

        <p className="text-gray-500">
          Sign in to your inventory account
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* COMPANY SLUG */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Company Slug
          </label>

          <input
            type="text"
            name="slug"
            placeholder="your-company"
            value={formData.slug}
            onChange={handleChange}
            className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />

          {errors.slug && (
            <p className="text-red-500 text-sm mt-1">
              {errors.slug}
            </p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />

          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input type="checkbox" />
            Remember me
          </label>

          <a
            href="/auth/forgot-password"
            className="text-indigo-600 font-medium hover:underline"
          >
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-60"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

      </form>

      {/* Divider */}
      <div className="flex items-center my-8">
        <div className="flex-1 border-b border-gray-200"></div>

        <span className="px-4 text-xs text-gray-400">
          OR CONTINUE WITH
        </span>

        <div className="flex-1 border-b border-gray-200"></div>
      </div>

      {/* Google Login */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() =>
            setErrors({
              general: 'Google login failed',
            })
          }
          
        />
      </div>

    </div>

  </div>
</div>


  </div>


);
};

export default Login;
