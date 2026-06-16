import React, { useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Submit OAuth2 login request
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Authentication failed. Please verify credentials.');
      }

      const tokenData = await response.json();
      localStorage.setItem('token', tokenData.access_token);

      // 2. Fetch authenticated profile detail (role & username verification)
      const profileResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to retrieve user profile data.');
      }

      const userData = await profileResponse.json();
      
      onLogin({
        username: userData.username,
        role: userData.role
      });
    } catch (err) {
      setError(err.message);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="glass max-w-md w-full p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-dark-border">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <span className="text-4xl">📄</span>
          <h2 className="text-3xl font-bold mt-4 tracking-tight">ConsensusDoc AI</h2>
          <p className="text-gray-400 text-sm mt-1">Enterprise Document Classification</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              disabled={loading}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-bg border border-dark-border focus:border-indigo-500 focus:outline-none text-white transition disabled:opacity-50"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-bg border border-dark-border focus:border-indigo-500 focus:outline-none text-white transition disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg gradient-btn text-sm font-semibold tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
