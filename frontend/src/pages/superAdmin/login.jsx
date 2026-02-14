import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../CSS/login.css"; // check correct path

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/auth/login",
        { email, password }
      );

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user?.role);

      navigate("/super-admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Super Admin Login</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
