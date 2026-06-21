import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Register from './Register';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'Admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/employee');
      }
    }
  }, [isAuthenticated, role, navigate]);

  // Support tab pre-selection from query params (e.g. /login?tab=signup)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'register') {
      setActiveTab('signup');
    } else {
      setActiveTab('signin');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email address/username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Submit login request (FastAPI expects username, which can be the email/username)
      const tokenData = await authService.login(email.trim(), password);
      
      const serverRole = tokenData.role || 'employee';
      // Capitalize to match Admin/Employee format used in sidebar and layout
      const capitalizedRole = serverRole.charAt(0).toUpperCase() + serverRole.slice(1).toLowerCase();

      // 2. Fetch profile info to verify authentication
      // Temporarily store token in localStorage so getCurrentUser interceptor sends it
      localStorage.setItem('token', tokenData.access_token);
      const profile = await authService.getCurrentUser();
      
      // Update global auth context
      login(tokenData.access_token, capitalizedRole, profile.username);

      addToast(`Successfully authenticated as ${profile.username}!`, 'success');

      // 3. Redirect to role specific dashboard
      if (capitalizedRole === 'Admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/employee');
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'Authentication failed. Please verify your credentials and try again.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      addToast(errMsg, 'error');
      
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-gray-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* 1. Animated Logo Centerpiece */}
      <div className="relative flex flex-col items-center justify-center mb-4 w-full max-w-lg select-none">
        
        {/* Background Polygon Pulse (Particle Effect Element) */}
        <svg className="absolute w-64 h-64 pointer-events-none opacity-45 z-0" viewBox="-150 -150 300 300">
          <motion.polygon
            points="0,-85 60,-60 85,0 60,60 0,85 -60,60 -85,0 -60,-60"
            fill="none"
            stroke="rgba(168, 85, 247, 0.15)"
            strokeWidth={1.5}
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <motion.polygon
            points="0,-110 77,-77 110,0 77,77 0,110 -77,77 -110,0 -77,-77"
            fill="none"
            stroke="rgba(34, 211, 238, 0.1)"
            strokeWidth={1}
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />

          {/* 3D Orbit paths & particles */}
          {/* Orbit 1: Tilted cyan orbit */}
          <g style={{ transform: 'rotate(-20deg) scaleY(0.35)' }}>
            <circle cx={0} cy={0} r={110} fill="none" stroke="rgba(34, 211, 238, 0.15)" strokeWidth={1} />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            >
              <circle cx={0} cy={-110} r={4} fill="#22d3ee" className="filter drop-shadow-[0_0_8px_#22d3ee]" />
            </motion.g>
          </g>

          {/* Orbit 2: Tilted pink orbit */}
          <g style={{ transform: 'rotate(35deg) scaleY(0.4)' }}>
            <circle cx={0} cy={0} r={95} fill="none" stroke="rgba(236, 72, 153, 0.12)" strokeWidth={1} />
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <circle cx={0} cy={-95} r={3.5} fill="#ec4899" className="filter drop-shadow-[0_0_8px_#ec4899]" />
            </motion.g>
          </g>
        </svg>

        {/* Glow backdrop behind the logo (Glow Pulse) */}
        <motion.div
          animate={{
            scale: [0.9, 1.05, 0.9],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute w-28 h-28 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 rounded-full filter blur-2xl z-0 pointer-events-none"
        />

        {/* Logo and text inside Float, Rotation, and Glow Pulse wrapper */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          whileHover={{
            scale: 1.08,
            filter: "drop-shadow(0 0 16px rgba(168, 85, 247, 0.55)) drop-shadow(0 0 8px rgba(34, 211, 238, 0.35))",
          }}
          className="relative z-10 flex flex-col items-center cursor-pointer transition-all duration-300"
        >
          {/* Logo glow pulse container */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 15px 1px rgba(168, 85, 247, 0.2), 0 0 8px 1px rgba(34, 211, 238, 0.1)",
                "0 0 28px 4px rgba(168, 85, 247, 0.45), 0 0 15px 2px rgba(34, 211, 238, 0.25)",
                "0 0 15px 1px rgba(168, 85, 247, 0.2), 0 0 8px 1px rgba(34, 211, 238, 0.1)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full filter blur-md pointer-events-none"
          />

          <img 
            src={logo} 
            alt="Anaptyss Logo" 
            className="w-[70px] sm:w-[90px] md:w-[120px] object-contain filter drop-shadow-[0_0_12px_rgba(188,85,247,0.3)] transition-all duration-300" 
          />
          
          <h1 className="text-white text-base sm:text-lg font-bold tracking-[4px] mt-4 uppercase font-sans select-none">
            ANAPTYSS
          </h1>
          <p className="text-gray-400 text-[10px] sm:text-[11px] tracking-wider mt-1.5 text-center font-normal font-sans max-w-[280px] leading-tight select-none">
            Enterprise AI Document Intelligence Platform
          </p>
        </motion.div>
      </div>

      {/* 2. Main glassmorphism card container */}
      <div className="w-full max-w-md glass rounded-2xl border border-gray-800/60 p-8 shadow-2xl relative z-10 backdrop-blur-xl transition-all duration-500 mb-8">
        
        {/* Welcome message inside card */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {activeTab === 'signin' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-xs mt-1.5">
            {activeTab === 'signin' ? 'Sign in to continue to your account' : 'Sign up to get started'}
          </p>
        </div>

        {/* Auth Tab Navigation */}
        <div className="flex bg-[#0b0f19]/80 p-1 rounded-xl border border-gray-800/60 mb-6 relative">
          <button
            onClick={() => { setActiveTab('signin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 relative z-10 uppercase tracking-wider font-mono ${
              activeTab === 'signin' ? 'text-white bg-indigo-600/40 border border-indigo-500/30' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 relative z-10 uppercase tracking-wider font-mono ${
              activeTab === 'signup' ? 'text-white bg-indigo-600/40 border border-indigo-500/30' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Active View Render */}
        {activeTab === 'signin' ? (
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-200 text-sm flex items-start gap-3 animate-shake">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2 font-mono">
                  Email / Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/80 border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white transition-all text-xs disabled:opacity-50"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2 font-mono">
                  Password
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none text-xs tracking-wide uppercase font-mono"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to System</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <Register onRegisterSuccess={() => setActiveTab('signin')} />
        )}

        <div className="mt-8 pt-4 border-t border-gray-800/40 text-center">
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">
            Secure connection managed via Ray Distributed Agent Cluster
          </p>
        </div>
      </div>

      {/* 3. Bottom Footer Features Row */}
      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 relative z-10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#090D16]/40 border border-gray-800/50 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-[10px] leading-tight">
            <span className="text-gray-200 block font-semibold">Secure</span>
            <span className="text-gray-400">Authentication</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#090D16]/40 border border-gray-800/50 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-[10px] leading-tight">
            <span className="text-gray-200 block font-semibold">AI-Powered</span>
            <span className="text-gray-400">Processing</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#090D16]/40 border border-gray-800/50 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="text-[10px] leading-tight">
            <span className="text-gray-200 block font-semibold">Accurate</span>
            <span className="text-gray-400">Results</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#090D16]/40 border border-gray-800/50 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-[10px] leading-tight">
            <span className="text-gray-200 block font-semibold">Enterprise</span>
            <span className="text-gray-400">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
