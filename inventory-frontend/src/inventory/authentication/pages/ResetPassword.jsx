import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import api from "../../../shared/utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const validatePassword = () => {
    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Minimum 8 characters required";
    if (!/[A-Z]/.test(password)) return "Include uppercase letter";
    if (!/[a-z]/.test(password)) return "Include lowercase letter";
    if (!/\d/.test(password)) return "Include number";
    if (!/[@$!%*?&]/.test(password)) return "Include special character";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passError = validatePassword();
    if (passError) {
      setErrors({ password: passError });
      return;
    }

    if (!confirmPassword) {
      setErrors({ confirmPassword: "Confirm password is required" });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      await api.post(`/api/users/auth/reset-password/${token}`, {
        password,
      });

      setMessage("Password reset successful!");

      setTimeout(() => {
        navigate(`/auth/login?slug=${slug}`);
      }, 2000);

    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message || "Server error. Try again.",
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center gap-3 mb-8">
          <Lock size={32} className="text-cyan-300" />
          <h1 className="text-3xl sm:text-4xl font-bold truncate">
            {slug?.trim() || 'StockInsight'}
          </h1>
        </div>

        <h2 className="text-4xl font-bold leading-tight">
          Set your
          <span className="block text-cyan-300">new password</span>
        </h2>

        <p className="mt-6 text-white/80 max-w-md">
          Create a strong password to secure your account and continue using the system.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-gray-50">

        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 md:p-10">

            {/* HEADER */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-500">
                Enter your new secure password
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

              {/* PASSWORD */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({});
                  }}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({});
                  }}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
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

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 text-white font-semibold hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

            </form>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;