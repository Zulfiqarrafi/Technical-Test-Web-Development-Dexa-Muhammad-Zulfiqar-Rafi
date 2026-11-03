import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormField } from '../components/ui/FormField';
import { BrandLogo } from '../components/ui/BrandLogo';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to={user.role === 'HRD' ? '/monitoring' : '/absensi'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Masukkan Email/NIK dan password terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(identifier.trim(), password);
      navigate(loggedInUser.role === 'HRD' ? '/monitoring' : '/absensi', {
        replace: true,
      });
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk ke sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setIdentifier(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ marginBottom: '22px' }}>
          <BrandLogo height={26} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Sistem Presensi WFH &amp; Monitoring Karyawan
          </div>
        </div>

        <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>
          Masuk ke Portal Internal
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Gunakan email korporat atau Nomor Induk Karyawan (NIK) Anda.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <FormField label="Email Korporat / NIK" htmlFor="login-identifier" required>
            <input
              id="login-identifier"
              type="text"
              className="form-input"
              placeholder="Contoh: budi.santoso@dexagroup.com atau DXG-22014"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </FormField>

          <FormField label="Password" htmlFor="login-password" required>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '68px' }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </FormField>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: '8px', height: '38px' }}
            disabled={submitting}
          >
            {submitting ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>

      <div className="login-demo-box">
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Akun Pengujian (Password: <span className="mono-code">password123</span>)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <span>
            <strong>Karyawan:</strong> budi.santoso@dexagroup.com
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fillDemoAccount('budi.santoso@dexagroup.com')}
          >
            Isi
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '4px',
          }}
        >
          <span>
            <strong>Admin HRD:</strong> hrd@dexagroup.com
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fillDemoAccount('hrd@dexagroup.com')}
          >
            Isi
          </button>
        </div>
      </div>
    </div>
  );
};

