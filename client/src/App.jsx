// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';

// User Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Studio from './pages/Studio';
import Projects from './pages/Projects';
import Templates from './pages/Templates';
import Explore from './pages/Explore';
import Credits from './pages/Credits';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminGenerations from './pages/admin/AdminGenerations';
import AdminModels from './pages/admin/AdminModels';
import AdminCredits from './pages/admin/AdminCredits';
import AdminSettings from './pages/admin/AdminSettings';

/**
 * Route protector checking for active user sessions
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-xs font-black uppercase text-white/30 tracking-widest">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span>Syncing workspace session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

/**
 * Administrative route guard restricting access to verified profiles containing the admin role
 */
const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07040D] flex flex-col items-center justify-center text-xs font-black uppercase text-purple-300/30 tracking-widest">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Authenticating Admin privileges...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin') {
    console.warn('[AdminRouteGuard] Unauthorized intrusion blocked.');
    return <Navigate to="/studio" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* User Protected Views */}
          <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Administrative Protected Views */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/generations" element={<AdminRoute><AdminGenerations /></AdminRoute>} />
          <Route path="/admin/models" element={<AdminRoute><AdminModels /></AdminRoute>} />
          <Route path="/admin/credits" element={<AdminRoute><AdminCredits /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

          {/* Redirections default fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Styled React Hot Toasts indicator notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(26, 26, 26, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '12.5px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '12px 24px'
          }
        }}
      />
    </AuthProvider>
  );
}
