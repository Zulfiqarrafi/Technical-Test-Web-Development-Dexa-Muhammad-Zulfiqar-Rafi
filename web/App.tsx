import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendancePage } from './pages/AttendancePage';
import { EmployeesPage } from './pages/EmployeesPage';
import { LoginPage } from './pages/LoginPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { MyHistoryPage } from './pages/MyHistoryPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; hrdOnly?: boolean }> = ({
  children,
  hrdOnly = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        Memuat sesi aplikasi...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hrdOnly && user.role !== 'HRD') {
    return <Navigate to="/absensi" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'HRD' ? '/monitoring' : '/absensi'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/absensi" element={<AttendancePage />} />
            <Route path="/riwayat" element={<MyHistoryPage />} />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute hrdOnly>
                  <MonitoringPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/karyawan"
              element={
                <ProtectedRoute hrdOnly>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/akun" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
