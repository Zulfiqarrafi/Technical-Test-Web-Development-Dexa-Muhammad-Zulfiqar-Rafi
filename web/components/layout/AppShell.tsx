import {
  ClipboardCheck,
  Clock,
  History,
  LogOut,
  Menu,
  UserCheck,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatFullDateId } from '../../utils/format';
import { BrandLogo } from '../ui/BrandLogo';
import { StatusBadge } from '../ui/StatusBadge';

const PAGE_TITLES: Record<string, string> = {
  '/absensi': 'Presensi WFH Hari Ini',
  '/riwayat': 'Riwayat Presensi Saya',
  '/monitoring': 'Monitoring Absensi Karyawan',
  '/karyawan': 'Data Master Karyawan',
  '/akun': 'Informasi Akun & Keamanan',
};

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const isHrd = user.role === 'HRD';
  const currentTitle = PAGE_TITLES[location.pathname] || 'Portal Presensi WFH';

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <BrandLogo height={20} subtitle="WFH Portal" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Presensi Karyawan</div>
          <NavLink
            to="/absensi"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Clock size={16} />
            Presensi Hari Ini
          </NavLink>
          <NavLink
            to="/riwayat"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <History size={16} />
            Riwayat Presensi
          </NavLink>

          {isHrd && (
            <>
              <div className="nav-section-label" style={{ marginTop: '14px' }}>
                Administrasi HRD
              </div>
              <NavLink
                to="/monitoring"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <ClipboardCheck size={16} />
                Monitoring Absensi
              </NavLink>
              <NavLink
                to="/karyawan"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={16} />
                Master Karyawan
              </NavLink>
            </>
          )}

          <div className="nav-section-label" style={{ marginTop: '14px' }}>
            Pengaturan
          </div>
          <NavLink
            to="/akun"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <UserCheck size={16} />
            Akun &amp; Password
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-name">{user.fullName}</div>
          <div className="sidebar-user-meta">
            {user.nik} &bull; {user.department?.code || user.position}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block"
            onClick={logout}
          >
            <LogOut size={14} />
            Keluar Sesi
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka navigasi"
            >
              <Menu size={18} />
            </button>
            <h1 className="topbar-title">{currentTitle}</h1>
          </div>

          <div className="topbar-right">
            <span>{formatFullDateId(new Date())}</span>
            <StatusBadge
              variant={isHrd ? 'danger' : 'neutral'}
              label={isHrd ? 'Admin HRD' : 'Karyawan'}
            />
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

