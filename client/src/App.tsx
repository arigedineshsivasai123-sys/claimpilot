import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClaimsListPage } from './pages/ClaimsListPage';
import { CreateClaimPage } from './pages/CreateClaimPage';
import { ClaimDetailsPage } from './pages/ClaimDetailsPage';
import { HumanReviewPage } from './pages/HumanReviewPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" text="Authenticating reviewer session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims"
                element={
                  <ProtectedRoute>
                    <ClaimsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims/new"
                element={
                  <ProtectedRoute>
                    <CreateClaimPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims/:id"
                element={
                  <ProtectedRoute>
                    <ClaimDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims/:id/review"
                element={
                  <ProtectedRoute>
                    <HumanReviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
            <p>ClaimPilot — AI-Powered Multi-Agent Health Insurance Claim Review | Synthetic Demo Platform</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
