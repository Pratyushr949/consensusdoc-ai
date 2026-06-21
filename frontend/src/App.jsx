// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Upload from './pages/Upload';
import Result from './pages/Result';
import Review from './pages/Review';
import Override from './pages/Override';
import Audit from './pages/Audit';

// Layout wrapper for authenticated dashboard pages
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex">
      {/* SaaS Left Sidebar */}
      <Sidebar />
      
      {/* Right panel (Navbar + Page body) */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col justify-start">
          {children}
        </main>
        
        <footer className="py-5 border-t border-dark-border text-center text-[10px] text-gray-500 bg-[#090D16]/30">
          &copy; {new Date().getFullYear()} ConsensusDoc AI. Intelligent Distributed Document Processing (Consensus Engine).
        </footer>
      </div>
    </div>
  );
}

// Redirect helper routing generic /dashboard URL to role specific paths
function DashboardRedirect() {
  const { role } = useAuth();
  if (role === 'Admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }
  return <Navigate to="/dashboard/employee" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Pages */}
          {/* Generic dashboard maps to dynamic role redirect */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />

          {/* Role specific Dashboards */}
          <Route 
            path="/dashboard/employee" 
            element={
              <ProtectedRoute allowedRoles={['Employee']}>
                <AppLayout>
                  <EmployeeDashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Upload />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/review" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Review />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/override/:docId/:pageNum" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Override />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/result/:docId" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Result />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/audit" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <Audit />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          {/* Wildcard Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
