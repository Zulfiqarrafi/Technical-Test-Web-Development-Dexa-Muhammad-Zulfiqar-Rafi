import React, { useCallback, useEffect, useState } from 'react';
import { attendanceApi } from '../api/attendance.api';
import { AttendanceDetailModal } from '../components/attendance/AttendanceDetailModal';
import { PhotoCaptureInput } from '../components/attendance/PhotoCaptureInput';
import { FormField } from '../components/ui/FormField';
import { LiveClock } from '../components/ui/LiveClock';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, TodayOverviewResponse } from '../types';
import {
  formatDateYmdToId,
  formatDurationMinutes,
  formatTimeWib,
} from '../utils/format';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<TodayOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [selectedDetail, setSelectedDetail] = useState<AttendanceRecord | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await attendanceApi.getTodayOverview();
      setOverview(res);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Gagal memuat status presensi hari ini.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const todayRecord = overview?.todayAttendance || null;
  const hasClockedIn = Boolean(todayRecord);
  const hasClockedOut = Boolean(todayRecord?.clockOutTime);

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!photo) {
      setFeedback({
        type: 'error',
        text: 'Silakan ambil atau unggah foto bukti bekerja dari rumah terlebih dahulu.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await attendanceApi.clockIn(photo, note);
      setPhoto(null);
      setNote('');
      setFeedback({
        type: 'success',
        text: 'Presensi masuk berhasil dicatat.',
      });
      await loadOverview();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Gagal mencatat presensi masuk.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      await attendanceApi.clockOut(photo, note);
      setPhoto(null);
      setNote('');
      setFeedback({
        type: 'success',
        text: 'Presensi pulang berhasil dicatat. Terima kasih atas kontribusi Anda hari ini.',
      });
      await loadOverview();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Gagal mencatat presensi pulang.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body" style={{ color: 'var(--text-muted)' }}>
          Memuat informasi presensi...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="attendance-grid">
        {/* Kolom Kiri: Form Utama Presensi WFH */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Form Pencatatan Presensi WFH</div>
              <div className="panel-subtitle">
                Jam batas tepat waktu masuk: <strong>{overview?.workStartLimit || '08:30'} WIB</strong>
              </div>
            </div>
            <div>
              {!hasClockedIn ? (
                <StatusBadge variant="neutral" label="Belum Absen Masuk" />
              ) : !hasClockedOut ? (
                <StatusBadge variant="info" label="Sedang Bekerja (WFH)" />
              ) : (
                <StatusBadge variant="success" label="Presensi Hari Ini Selesai" />
              )}
            </div>
          </div>

          <div className="panel-body">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '14px 16px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
              }}
            >
              <LiveClock serverTimeIso={overview?.serverTime} />
              <div style={{ textAlign: 'right', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.fullName}
                </div>
                <div>
                  {user?.nik} &bull; {user?.department?.name || user?.position}
                </div>
                {user?.workLocation && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Lokasi WFH: {user.workLocation}
                  </div>
                )}
              </div>
            </div>

            {feedback && (
              <div
                className={`alert ${
                  feedback.type === 'success' ? 'alert-success' : 'alert-error'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {/* State 1: Belum Absen Masuk */}
            {!hasClockedIn && (
              <form onSubmit={handleClockIn}>
                <FormField
                  label="Foto Bukti Bekerja di Rumah (WFH)"
                  required
                  hint="Pastikan foto memperlihatkan aktivitas atau ruang kerja Anda secara jelas."
                >
                  <PhotoCaptureInput
                    value={photo}
                    onChange={setPhoto}
                    employeeLabel={user ? `${user.fullName} (${user.nik})` : undefined}
                    required
                  />
                </FormField>

                <FormField
                  label="Rencana / Fokus Pekerjaan Hari Ini"
                  htmlFor="clock-in-note"
                  hint="Opsional — cantumkan agenda atau tugas utama yang dikerjakan hari ini."
                >
                  <textarea
                    id="clock-in-note"
                    className="form-textarea"
                    placeholder="Contoh: Penyelesaian modul pelaporan stok cabang dan rapat koordinasi tim jam 10:00"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </FormField>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  style={{ height: '40px', marginTop: '6px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Mengirim Data Presensi...' : 'Submit Absen Masuk WFH'}
                </button>
              </form>
            )}

            {/* State 2: Sudah Absen Masuk, Belum Absen Pulang */}
            {hasClockedIn && !hasClockedOut && todayRecord && (
              <div>
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Tercatat Absen Masuk
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }} className="tabular-nums">
                      {formatTimeWib(todayRecord.clockInTime, true)}{' '}
                      <StatusBadge
                        variant={todayRecord.status === 'ON_TIME' ? 'success' : 'warning'}
                        label={todayRecord.status === 'ON_TIME' ? 'Tepat Waktu' : 'Terlambat'}
                      />
                    </div>
                    {todayRecord.clockInNote && (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Agenda: {todayRecord.clockInNote}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedDetail(todayRecord)}
                  >
                    Lihat Foto Masuk
                  </button>
                </div>

                <form onSubmit={handleClockOut}>
                  <FormField
                    label="Foto Bukti Selesai Kerja (Opsional)"
                    hint="Anda dapat melampirkan foto penutupan kerja atau langsung mengisi ringkasan hasil kerja."
                  >
                    <PhotoCaptureInput
                      value={photo}
                      onChange={setPhoto}
                      employeeLabel={user ? `${user.fullName} (${user.nik})` : undefined}
                    />
                  </FormField>

                  <FormField
                    label="Ringkasan Hasil Pekerjaan Hari Ini"
                    htmlFor="clock-out-note"
                    required
                  >
                    <textarea
                      id="clock-out-note"
                      className="form-textarea"
                      placeholder="Tuliskan progres atau output pekerjaan yang telah diselesaikan hari ini"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      required
                    />
                  </FormField>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    style={{ height: '40px', marginTop: '6px' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan Absen Pulang...' : 'Submit Absen Pulang WFH'}
                  </button>
                </form>
              </div>
            )}

            {/* State 3: Presensi Hari Ini Lengkap */}
            {hasClockedIn && hasClockedOut && todayRecord && (
              <div
                style={{
                  border: '1px solid var(--success-border)',
                  background: 'var(--success-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--success-text)', marginBottom: '8px' }}>
                  Presensi WFH Anda hari ini telah lengkap tercatat.
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    fontSize: '13px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Jam Masuk</div>
                    <strong className="tabular-nums">
                      {formatTimeWib(todayRecord.clockInTime, true)}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Jam Pulang</div>
                    <strong className="tabular-nums">
                      {formatTimeWib(todayRecord.clockOutTime, true)}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Total Durasi</div>
                    <strong>{formatDurationMinutes(todayRecord.workDurationMinutes)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedDetail(todayRecord)}
                >
                  Lihat Detail &amp; Bukti Foto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Bulan Ini & Aktivitas Terakhir */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Rekapitulasi Bulan Berjalan</div>
                <div className="panel-subtitle">Periode {overview?.monthSummary.month}</div>
              </div>
            </div>
            <div
              className="panel-body"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="summary-label">Total Hari Hadir</div>
                <div className="summary-value">{overview?.monthSummary.totalPresent ?? 0}</div>
              </div>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="summary-label">Tepat Waktu</div>
                <div className="summary-value" style={{ color: 'var(--success-text)' }}>
                  {overview?.monthSummary.onTime ?? 0}
                </div>
              </div>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="summary-label">Terlambat</div>
                <div className="summary-value" style={{ color: 'var(--warning-text)' }}>
                  {overview?.monthSummary.late ?? 0}
                </div>
              </div>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="summary-label">Lengkap Masuk &amp; Pulang</div>
                <div className="summary-value">{overview?.monthSummary.completedOut ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">5 Presensi Terakhir</div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Masuk</th>
                    <th>Pulang</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {!overview?.recentLogs.length ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}
                      >
                        Belum ada catatan presensi.
                      </td>
                    </tr>
                  ) : (
                    overview.recentLogs.map((row) => (
                      <tr key={row.id}>
                        <td>{formatDateYmdToId(row.attendanceDate)}</td>
                        <td className="tabular-nums">{formatTimeWib(row.clockInTime)}</td>
                        <td className="tabular-nums">{formatTimeWib(row.clockOutTime)}</td>
                        <td>
                          <StatusBadge
                            variant={row.status === 'ON_TIME' ? 'success' : 'warning'}
                            label={row.status === 'ON_TIME' ? 'Tepat Waktu' : 'Terlambat'}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedDetail(row)}
                          >
                            Bukti
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AttendanceDetailModal
        record={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </>
  );
};

