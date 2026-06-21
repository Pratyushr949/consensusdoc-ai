import React, { useState } from 'react';
import { authService } from '../services/api';
import { User, Mail, Lock, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ToastContext';

function Register({ onRegisterSuccess }) {
  const { addToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Field validations
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all the fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Basic email format regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Exclude fullName when sending to backend to match UserRegister schema
      await authService.register(username.trim(), email.trim(), password, role);
      addToast('Account created successfully! You can now sign in.', 'success');
      
      // Clear fields
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('Employee');
      
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'Registration failed. Username or email might already be registered.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-200 text-sm flex items-start gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1.5 font-mono">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={fullName}
              disabled={loading}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/80 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1.5 font-mono">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={username}
              disabled={loading}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/80 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50"
              placeholder="johndoe"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1.5 font-mono">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/80 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50"
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        {/* Role Selection Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1.5 font-mono">
            Account Role
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Shield className="w-4 h-4" />
            </span>
            <select
              value={role}
              disabled={loading}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/85 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50 appearance-none cursor-pointer"
              required
            >
              <option value="Employee" className="bg-[#0b0f19] text-white">Employee</option>
              <option value="Admin" className="bg-[#0b0f19] text-white">Admin</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1.5 font-mono">
            Password (Min. 6 chars)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/80 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1.5 font-mono">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={confirmPassword}
              disabled={loading}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/80 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none text-xs tracking-wide uppercase font-mono"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default Register;
