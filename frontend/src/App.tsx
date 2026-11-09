import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CreditProvider } from './contexts/CreditContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Studio } from './pages/Studio';
import { StoryStudio } from './pages/StoryStudio';
import { VoiceLibrary } from './pages/VoiceLibrary';
import { VoiceClone } from './pages/VoiceClone';
import { History } from './pages/History';
import { Dashboard } from './pages/Dashboard';
import { Pricing } from './pages/Pricing';
import { AdminTopup } from './pages/AdminTopup';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CreditProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Studio />} />
              <Route path="story" element={<StoryStudio />} />
              <Route path="voices" element={<VoiceLibrary />} />
              <Route path="clone" element={<VoiceClone />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="admin/topup" element={<AdminTopup />} />
              <Route path="history" element={<History />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CreditProvider>
    </AuthProvider>
  );
};

export default App;
