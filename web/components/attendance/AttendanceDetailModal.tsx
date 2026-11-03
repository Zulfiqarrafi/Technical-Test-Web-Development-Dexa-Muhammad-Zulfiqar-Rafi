import { ExternalLink } from 'lucide-react';
import React from 'react';
import { AttendanceRecord } from '../../types';
import {
  formatDateYmdToId,
  formatDurationMinutes,
  formatTimeWib,
} from '../../utils/format';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

interface AttendanceDetailModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  return (
    <Modal
      open={Boolean(record)}
      title={`Detail Presensi WFH — ${formatDateYmdToId(record.attendanceDate)}`}
      size="lg"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Tutup
        </button>
      }
    >
      {record.employee && (
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Nama &amp; NIK</div>
            <div style={{ fontWeight: 600 }}>
              {record.employee.fullName}{' '}
              <span className="mono-code">({record.employee.nik})</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Departemen / Jabatan
            </div>
            <div style={{ fontWeight: 500 }}>
              {record.employee.department?.name || '-'} — {record.employee.position}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Lokasi WFH</div>
            <div>{record.employee.workLocation || '-'}</div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Waktu Masuk</div>
          <div style={{ fontWeight: 600 }} className="tabular-nums">
            {formatTimeWib(record.clockInTime, true)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Waktu Pulang</div>
          <div style={{ fontWeight: 600 }} className="tabular-nums">
            {formatTimeWib(record.clockOutTime, true)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Durasi Kerja</div>
          <div style={{ fontWeight: 600 }}>
            {formatDurationMinutes(record.workDurationMinutes)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Status Kehadiran</div>
          <div style={{ marginTop: '2px' }}>
            <StatusBadge
              variant={record.status === 'ON_TIME' ? 'success' : 'warning'}
              label={record.status === 'ON_TIME' ? 'Tepat Waktu' : 'Terlambat'}
            />
          </div>
        </div>
      </div>

      <div className="form-grid-2">
        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <strong style={{ fontSize: '13px' }}>Bukti Foto Absen Masuk</strong>
            <a
              href={record.clockInPhoto}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px',
                color: 'var(--brand-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
              }}
            >
              Buka ukuran penuh <ExternalLink size={12} />
            </a>
          </div>
          <div className="camera-viewport" style={{ aspectRatio: '3 / 2' }}>
            <img src={record.clockInPhoto} alt="Bukti absen masuk" />
          </div>
          <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
              Catatan Rencana Kerja:
            </div>
            <div style={{ marginTop: '2px' }}>{record.clockInNote || '—'}</div>
            {record.clockInIp && (
              <div
                style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}
                className="mono-code"
              >
                IP Tercatat: {record.clockInIp}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <strong style={{ fontSize: '13px' }}>Bukti &amp; Ringkasan Absen Pulang</strong>
            {record.clockOutPhoto && (
              <a
                href={record.clockOutPhoto}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  color: 'var(--brand-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                }}
              >
                Buka ukuran penuh <ExternalLink size={12} />
              </a>
            )}
          </div>
          {record.clockOutPhoto ? (
            <div className="camera-viewport" style={{ aspectRatio: '3 / 2' }}>
              <img src={record.clockOutPhoto} alt="Bukti absen pulang" />
            </div>
          ) : (
            <div
              style={{
                aspectRatio: '3 / 2',
                background: 'var(--bg-subtle)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '12.5px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              {record.clockOutTime
                ? 'Tidak ada lampiran foto saat absen pulang'
                : 'Karyawan belum melakukan absen pulang'}
            </div>
          )}
          <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
              Ringkasan Pekerjaan Selesai:
            </div>
            <div style={{ marginTop: '2px' }}>{record.clockOutNote || '—'}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

