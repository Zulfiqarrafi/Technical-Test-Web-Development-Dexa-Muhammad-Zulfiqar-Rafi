import React, { useState } from 'react';
import { authApi } from '../api/auth.api';
import { FormField } from '../components/ui/FormField';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { formatDateYmdToId } from '../utils/format';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  if (!user) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal terdiri dari 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setSaving(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Gagal memperbarui password.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Profil Kepegawaian</div>
            <div className="panel-subtitle">
              Perubahan data kepegawaian dilakukan melalui bagian Human Capital (HRD).
            </div>
          </div>
          <StatusBadge
            variant={user.isActive ? 'success' : 'neutral'}
            label={user.isActive ? 'Status Aktif' : 'Nonaktif'}
          />
        </div>

        <div className="panel-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NIK</div>
              <div style={{ fontWeight: 600 }} className="mono-code">
                {user.nik}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nama Lengkap</div>
              <div style={{ fontWeight: 600 }}>{user.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email Korporat</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No. Telepon</div>
              <div>{user.phone || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Departemen</div>
              <div>{user.department?.name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Jabatan</div>
              <div>{user.position}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tanggal Bergabung</div>
              <div>{formatDateYmdToId(user.joinDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Domisili WFH</div>
              <div>{user.workLocation || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Ubah Password Akun</div>
            <div className="panel-subtitle">
              Gunakan kombinasi password yang aman dan tidak dibagikan kepada pihak lain.
            </div>
          </div>
        </div>

        <div className="panel-body">
          {message && (
            <div
              className={`alert ${
                message.type === 'success' ? 'alert-success' : 'alert-error'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <FormField label="Password Saat Ini" required>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Password Baru" required hint="Minimal 6 karakter.">
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Ulangi Password Baru" required>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ marginTop: '4px' }}
            >
              {saving ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

