import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  const login = (newToken, newRole, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setRole(newRole);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
