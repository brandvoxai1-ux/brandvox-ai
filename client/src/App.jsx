import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages (Eagerly loaded for instant first paint)
import Landing from './pages/Landing';
import Auth from './pages/Auth';

// Lazy-loaded User Pages (Code-split)
const Studio = lazy(() => import('./pages/Studio'));
const Projects = lazy(() => import('./pages/Projects'));
const Templates = lazy(() => import('./pages/Templates'));
const Explore = lazy(() => import('./pages/Explore'));
const Credits = lazy(() => import('./pages/Credits'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy-loaded Admin Pages (Code-split to isolate Recharts & Admin bundles)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminGenerations = lazy(() => import('./pages/admin/AdminGenerations'));
const AdminModels = lazy(() => import('./pages/admin/AdminModels'));
const AdminCredits = lazy(() => import('./pages/admin/AdminCredits'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

/**
 * Universal BrandVox page suspension loader
 */
const PageLoader = () => (
  <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-xs font-black uppercase text-white/40 tracking-widest select-none">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3 shadow-glow" />
    <span>Loading BrandVox...</span>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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
