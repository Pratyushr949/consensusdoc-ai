// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // If role is restricted and user's role is not in the allowed list
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Block admin pages for employee, redirecting to employee dashboard
    if (role === 'Employee') {
      return <Navigate to="/dashboard/employee" replace />;
    }
    // Block employee pages for admin if needed, or fallback to admin dashboard
    return <Navigate to="/dashboard/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;
