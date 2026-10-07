import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { Eye, EyeOff} from 'lucide-react';
import api from '../../../shared/utils/api';

const ActivateAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setUser, setIsAuthenticated } = useAuthContext();

  const stateEmail = location.state?.email || '';
  const stateSlug = location.state?.slug || '';
  const queryEmail = searchParams.get('email') || '';
  const querySlug = searchParams.get('slug') || '';
  const queryCode = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    email: stateEmail || queryEmail,
    slug: stateSlug || querySlug,
    code: queryCode,
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Minimum 8 characters required";
    if (!/[A-Z]/.test(password)) return "Include uppercase letter";
    if (!/[a-z]/.test(password)) return "Include lowercase letter";
    if (!/\d/.test(password)) return "Include number";
    if (!/[@$!%*?&]/.test(password)) return "Include special character";
    return '';
  };
  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!emailRegex.test(email)) {
      return "Enter a valid email address";
    }
  
    return "";
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({});
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(formData.email);

if (emailError) {
  setErrors({ email: emailError });
  return;
}
    
    if (!formData.slug.trim()) {
      setErrors({ slug: "Slug is required" });
      return;
    }
    const passError = validatePassword(formData.newPassword);
  if (passError) {
    setErrors({ newPassword: passError });
    return;
  }
  
  if (formData.newPassword !== formData.confirmPassword) {
    setErrors({ confirmPassword: "Passwords do not match" });
    return;
  }

    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      await api.post('/api/users/invite/activate', formData);

      const loginRes = await api.post('/api/users/auth/login', {
        email: formData.email,
        password: formData.newPassword,
        slug: formData.slug
      });

      const data = loginRes.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      navigate('/dashboard');

    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      await api.post('/api/users/invite/resend-otp', {
        email: formData.email,
        slug: formData.slug
      });

      setMessage("OTP resent successfully!");
    } catch (err) {
      setErrors({ general: "Failed to resend OTP" });
    }

    setTimeout(() => setResendLoading(false), 60000);
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 flex-col justify-center text-white">

      <div className="flex items-center gap-3 mb-8">
      <img
    src="/stockinsight-logo.jpg"
    alt="StockInsight Logo"
    className="w-15 h-15 object-contain rounded-xl"
  />

  <h1 className="text-3xl sm:text-4xl font-bold">
    StockInsight
  </h1>
</div>

        <h2 className="text-4xl font-bold leading-tight">
          Activate your
          <span className="block text-cyan-300">secure account</span>
        </h2>

        <p className="mt-6 text-white/80 max-w-md">
          Enter OTP sent to your email and set a secure password to continue.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-gray-50">

        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 md:p-10">

            {/* HEADER */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Activate Account
              </h2>
              <p className="text-gray-500">
                Verify OTP and set new password
              </p>
            </div>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">
                {message}
              </div>
            )}

            {errors.general && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <input
  name="email"
  value={formData.email}
  placeholder="Enter Email"
  onChange={handleChange}
  readOnly={!!location.state}
  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
/>
{errors.email && (
  <p className="text-red-500 text-sm mt-1">
    {errors.email}
  </p>
)}
              {/* SLUG */}
              <input
  name="slug"
  value={formData.slug}
  placeholder="Enter Slug"
  onChange={handleChange}
  readOnly={!!location.state}
  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
/>
{errors.slug && (
  <p className="text-red-500 text-sm mt-1">
    {errors.slug}
  </p>
)}
              {/* OTP */}
              <div>
                <input
                  name="code"
                  placeholder="Enter 6-digit OTP"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              {/* PASSWORD */}
    {/* NEW PASSWORD */}
<div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    name="newPassword"
    placeholder="New password"
    value={formData.newPassword}
    onChange={handleChange}
    className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-3 text-gray-500"
  >
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>

  {errors.newPassword && (
    <p className="text-red-500 text-sm mt-1">
      {errors.newPassword}
    </p>
  )}
</div>               {/* CONFIRM PASSWORD */}
            {/* CONFIRM PASSWORD */}
<div className="relative">
  <input
    type={showConfirmPassword ? "text" : "password"}
    name="confirmPassword"
    placeholder="Confirm password"
    value={formData.confirmPassword}
    onChange={handleChange}
    className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-4 top-3 text-gray-500"
  >
    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>

  {errors.confirmPassword && (
    <p className="text-red-500 text-sm mt-1">
      {errors.confirmPassword}
    </p>
  )}
</div>
              {/* RESEND OTP */}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-sm text-indigo-600 hover:underline"
              >
                {resendLoading ? "Resending..." : "Resend OTP"}
              </button>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 text-white font-semibold hover:scale-[1.01] transition-all"
              >
                {loading ? "Activating..." : "Verify & Activate"}
              </button>

            </form>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;