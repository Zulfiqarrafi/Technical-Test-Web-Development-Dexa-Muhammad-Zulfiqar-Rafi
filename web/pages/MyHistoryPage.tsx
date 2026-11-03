import React, { useCallback, useEffect, useState } from 'react';
import { attendanceApi } from '../api/attendance.api';
import { AttendanceDetailModal } from '../components/attendance/AttendanceDetailModal';
import { DataTable, TableColumn } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AttendanceRecord, PaginationMeta } from '../types';
import {
  formatDateYmdToId,
  formatDurationMinutes,
  formatTimeWib,
  getCurrentMonthWib,
} from '../utils/format';

export const MyHistoryPage: React.FC = () => {
  const [month, setMonth] = useState<string>(getCurrentMonthWib());
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getMyHistory({
        month: month || undefined,
        page,
        limit: 15,
      });
      setRows(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [month, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const columns: TableColumn<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      render: (r) => <strong>{formatDateYmdToId(r.attendanceDate)}</strong>,
    },
    {
      key: 'clockIn',
      header: 'Jam Masuk',
      render: (r) => <span className="tabular-nums">{formatTimeWib(r.clockInTime, true)}</span>,
    },
    {
      key: 'clockOut',
      header: 'Jam Pulang',
      render: (r) => <span className="tabular-nums">{formatTimeWib(r.clockOutTime, true)}</span>,
    },
    {
      key: 'duration',
      header: 'Durasi',
      render: (r) => formatDurationMinutes(r.workDurationMinutes),
    },
    {
      key: 'status',
      header: 'Status Masuk',
      render: (r) => (
        <StatusBadge
          variant={r.status === 'ON_TIME' ? 'success' : 'warning'}
          label={r.status === 'ON_TIME' ? 'Tepat Waktu' : 'Terlambat'}
        />
      ),
    },
    {
      key: 'note',
      header: 'Catatan Pekerjaan',
      render: (r) => (
        <div
          style={{
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--text-secondary)',
          }}
          title={r.clockInNote || ''}
        >
          {r.clockInNote || '—'}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Bukti WFH',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedRecord(r)}
        >
          Lihat Foto
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Daftar Riwayat Presensi WFH</div>
            <div className="panel-subtitle">
              Catatan kehadiran, waktu presensi, serta arsip foto bukti kerja Anda.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="filter-month"
              style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}
            >
              Periode Bulan:
            </label>
            <input
              id="filter-month"
              type="month"
              className="form-input"
              style={{ width: '170px' }}
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
            />
            {month && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setMonth('');
                  setPage(1);
                }}
              >
                Semua Periode
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyMessage="Belum ada data riwayat presensi pada periode yang dipilih."
        />

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <AttendanceDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
};

