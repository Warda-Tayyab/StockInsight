import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/utils/api";
import { Mail } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", slug: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({});
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      const res = await api.post(
        "/api/users/auth/forgot-password",
        formData
      );

      const data = res.data;
      setMessage(data.message || "Reset link sent to your email.");
    } catch (err) {
      const data = err.response?.data;

      if (data?.errorField) {
        setErrors({ [data.errorField]: data.message });
      } else {
        setErrors({
          general: data?.message || "Server error. Try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">

      {/* LEFT SIDE (same as login but simplified) */}
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
          Reset your
          <span className="block text-cyan-300">
            password safely
          </span>
        </h2>

        <p className="mt-6 text-white/80 max-w-md">
          Enter your company slug and email address. We’ll send you a secure reset link.
        </p>

        <div className="mt-10 bg-white/10 border border-white/20 p-6 rounded-3xl">
          <Mail className="text-cyan-300 mb-3" size={32} />
          <p className="text-white/70">
            Keep your account secure with encrypted password recovery.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 md:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Forgot Password
              </h2>
              <p className="text-gray-500">
                Enter your details to receive reset link
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

              {/* SLUG */}
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
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 text-white font-semibold hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

            </form>

            {/* Back to login */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Remember password?{" "}
              <a href="/auth/login" className="text-indigo-600 hover:underline">
                Sign in
              </a>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;