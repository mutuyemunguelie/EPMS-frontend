import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authAPI";
import {
  UserPlus, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, User, Shield,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", password: "", confirmPassword: "", role: "hr",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => {
    setError(""); setSuccess("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.username.trim()) return "Username is required.";
    if (form.username.trim().length < 3) return "Min 3 characters.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 4) return "Min 4 characters.";
    if (form.password !== form.confirmPassword) return "Passwords don't match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await registerUser({
        username: form.username.trim().toLowerCase(),
        password: form.password, role: form.role,
      });
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-panel-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-brand-600 flex items-center
                          justify-center mb-4 shadow-md">
            <UserPlus className="text-white" size={22} />
          </div>
          <h1 className="text-xl font-bold text-panel-900">Create Account</h1>
          <p className="text-panel-500 text-sm mt-1">Register a new EPMS user</p>
        </div>

        <div className="card">
          <div className="card-body space-y-4">
            {error && <div className="alert-error"><AlertCircle size={14} /> {error}</div>}
            {success && <div className="alert-success"><CheckCircle2 size={14} /> {success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                  <input type="text" name="username" value={form.username}
                         onChange={handleChange} placeholder="e.g. john_doe"
                         className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Role</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                  <select name="role" value={form.role} onChange={handleChange}
                          className="input-field pl-10">
                    <option value="hr">HR Staff</option>
                    <option value="admin">Administrator</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                  <input type={showPw ? "text" : "password"} name="password"
                         value={form.password} onChange={handleChange}
                         placeholder="Min. 4 characters" className="input-field pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-panel-400
                                     hover:text-panel-600 transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
                  <input type={showPw ? "text" : "password"} name="confirmPassword"
                         value={form.confirmPassword} onChange={handleChange}
                         placeholder="Repeat password" className="input-field pl-10" />
                </div>
                {form.password && form.confirmPassword && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    form.password === form.confirmPassword ? "text-brand-600" : "text-red-500"
                  }`}>
                    {form.password === form.confirmPassword
                      ? <><CheckCircle2 size={12} /> Passwords match</>
                      : <><AlertCircle size={12} /> Passwords don't match</>}
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <p className="text-center text-panel-400 text-xs pt-1">
              Have an account?{" "}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;