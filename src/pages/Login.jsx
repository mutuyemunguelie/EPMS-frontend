import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/authAPI";
import {
  Lock, User, Eye, EyeOff, AlertCircle, Info,
  Shield, Briefcase,
} from "lucide-react";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState("staff");
  const [form, setForm]       = useState({ username: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { setError("Username required."); return; }
    if (!form.password) { setError("Password required."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await loginUser(form);
      login(res.data.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-panel-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-brand-600 flex items-center
                          justify-center mb-4 shadow-md">
            <Lock className="text-white" size={22} />
          </div>
          <h1 className="text-xl font-bold text-panel-900">Sign in to EPMS</h1>
          <p className="text-panel-500 text-sm mt-1">SmartPark Payroll System</p>
        </div>

        <div className="card">
          <div className="card-body space-y-5">

            {/* Login Type Toggle */}
            <div className="flex rounded-lg bg-panel-100 p-0.5">
              <button
                onClick={() => { setLoginType("staff"); setForm({ username: "", password: "" }); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md
                            text-xs font-semibold transition-all duration-150
                            ${loginType === "staff"
                              ? "bg-white shadow-sm text-brand-700"
                              : "text-panel-500 hover:text-panel-700"}`}
              >
                <Shield size={13} /> Admin / HR
              </button>
              <button
                onClick={() => { setLoginType("employee"); setForm({ username: "", password: "" }); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md
                            text-xs font-semibold transition-all duration-150
                            ${loginType === "employee"
                              ? "bg-white shadow-sm text-purple-700"
                              : "text-panel-500 hover:text-panel-700"}`}
              >
                <Briefcase size={13} /> Employee
              </button>
            </div>

            {/* Hints */}
            {loginType === "staff" ? (
              <div className="alert-info text-xs">
                <Info size={14} />
                <div>
                  <span className="font-semibold">admin</span> / admin123
                  &nbsp;·&nbsp;
                  <span className="font-semibold">hr</span> / hr1234
                </div>
              </div>
            ) : (
              <div className="px-3 py-2.5 rounded-lg bg-purple-50 border border-purple-200
                              text-purple-700 text-xs flex items-start gap-2">
                <Briefcase size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Employee Login</p>
                  <p className="text-purple-600">
                    Username: your employee number (e.g. EMP001)
                  </p>
                  <p className="text-purple-600">
                    Password: your telephone number
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="alert-error">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">
                  {loginType === "employee" ? "Employee Number" : "Username"}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder={loginType === "employee" ? "e.g. EMP001" : "Enter username"}
                    className="input-field pl-10"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  {loginType === "employee" ? "Telephone (Password)" : "Password"}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={loginType === "employee" ? "e.g. 0781234567" : "Enter password"}
                    className="input-field pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-panel-400 hover:text-panel-600 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2
                            ${loginType === "employee" ? "btn bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500 shadow-sm active:scale-[0.98]" : "btn-primary"}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : loginType === "employee" ? (
                  <><Briefcase size={15} /> Sign in as Employee</>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Register link — only for staff */}
            {loginType === "staff" && (
              <p className="text-center text-panel-400 text-xs pt-2">
                No admin/HR account?{" "}
                <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
                  Register
                </Link>
              </p>
            )}

            {loginType === "employee" && (
              <p className="text-center text-panel-400 text-xs pt-2">
                Don't have credentials? Contact your HR department.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-panel-400 text-[10px] mt-6">
          EPMS © {new Date().getFullYear()} SmartPark · Rubavu District
        </p>
      </div>
    </div>
  );
};

export default Login;