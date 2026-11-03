import { Download, Eye, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { attendanceApi } from '../api/attendance.api';
import { employeesApi } from '../api/employees.api';
import { AttendanceDetailModal } from '../components/attendance/AttendanceDetailModal';
import { DataTable, TableColumn } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  AttendanceRecord,
  Department,
  DepartmentBreakdown,
  MonitorSummaryResponse,
  PaginationMeta,
} from '../types';
import {
  formatDateYmdToId,
  formatDurationMinutes,
  formatTimeWib,
  getTodayWibYmd,
} from '../utils/format';

export const MonitoringPage: React.FC = () => {
  const todayYmd = getTodayWibYmd();

  const [activeTab, setActiveTab] = useState<'submitted' | 'department' | 'missing'>('submitted');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<MonitorSummaryResponse | null>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(todayYmd);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [completion, setCompletion] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    employeesApi.getDepartments().then(setDepartments).catch(() => undefined);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const targetDate = endDate || todayYmd;
      const res = await attendanceApi.getMonitorSummary(targetDate);
      setSummary(res);
    } catch {
      // ignore
    }
  }, [endDate, todayYmd]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getMonitorList({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
        completion: completion || undefined,
        search: search || undefined,
        page,
        limit: 12,
      });
      setRows(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, status, completion, search, page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate(todayYmd);
    setDepartmentId('');
    setStatus('');
    setCompletion('');
    setSearch('');
    setPage(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const allData = await attendanceApi.getMonitorList({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
        completion: completion || undefined,
        search: search || undefined,
        page: 1,
        limit: 500,
      });

      const headers = [
        'Tanggal',
        'NIK',
        'Nama Karyawan',
        'Departemen',
        'Jabatan',
        'Jam Masuk (WIB)',
        'Jam Pulang (WIB)',
        'Durasi (Menit)',
        'Status',
        'Catatan Masuk',
        'Catatan Pulang',
      ];

      const escapeCsv = (val: unknown) => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const lines = allData.data.map((r) =>
        [
          r.attendanceDate,
          r.employee?.nik || '',
          r.employee?.fullName || '',
          r.employee?.department?.name || '',
          r.employee?.position || '',
          formatTimeWib(r.clockInTime, true),
          formatTimeWib(r.clockOutTime, true),
          r.workDurationMinutes ?? '',
          r.status === 'ON_TIME' ? 'Tepat Waktu' : 'Terlambat',
          r.clockInNote || '',
          r.clockOutNote || '',
        ]
          .map(escapeCsv)
          .join(','),
      );

      const csvContent = '\uFEFF' + [headers.join(','), ...lines].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-absensi-wfh-${endDate || todayYmd}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const submittedColumns: TableColumn<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      render: (r) => (
        <span style={{ fontWeight: 500 }}>{formatDateYmdToId(r.attendanceDate)}</span>
      ),
    },
    {
      key: 'employee',
      header: 'Karyawan',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.employee?.fullName || '-'}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span className="mono-code">{r.employee?.nik}</span> &bull;{' '}
            {r.employee?.position}
          </div>
        </div>
      ),
    },
    {
      key: 'dept',
      header: 'Departemen',
      render: (r) => r.employee?.department?.name || '-',
    },
    {
      key: 'clockIn',
      header: 'Absen Masuk',
      render: (r) => (
        <span className="tabular-nums">{formatTimeWib(r.clockInTime, true)}</span>
      ),
    },
    {
      key: 'clockOut',
      header: 'Absen Pulang',
      render: (r) =>
        r.clockOutTime ? (
          <span className="tabular-nums">{formatTimeWib(r.clockOutTime, true)}</span>
        ) : (
          <StatusBadge variant="info" label="Masih Bekerja" />
        ),
    },
    {
      key: 'duration',
      header: 'Durasi',
      render: (r) => formatDurationMinutes(r.workDurationMinutes),
    },
    {
      key: 'status',
      header: 'Ketepatan',
      render: (r) => (
        <StatusBadge
          variant={r.status === 'ON_TIME' ? 'success' : 'warning'}
          label={r.status === 'ON_TIME' ? 'Tepat Waktu' : 'Terlambat'}
        />
      ),
    },
    {
      key: 'proof',
      header: 'Kontrol Bukti',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedRecord(r)}
        >
          <Eye size={13} />
          Lihat Bukti
        </button>
      ),
    },
  ];

  const missingColumns: TableColumn<MonitorSummaryResponse['missingEmployees'][number]>[] = [
    {
      key: 'nik',
      header: 'NIK',
      render: (e) => <span className="mono-code">{e.nik}</span>,
    },
    {
      key: 'name',
      header: 'Nama Lengkap',
      render: (e) => <strong>{e.fullName}</strong>,
    },
    {
      key: 'dept',
      header: 'Departemen',
      render: (e) => e.department?.name || '-',
    },
    {
      key: 'position',
      header: 'Jabatan',
      render: (e) => e.position,
    },
    {
      key: 'phone',
      header: 'No. Telepon',
      render: (e) => e.phone || '—',
    },
    {
      key: 'location',
      header: 'Lokasi WFH',
      render: (e) => e.workLocation || '—',
    },
    {
      key: 'status',
      header: 'Status Tanggal Ini',
      render: () => <StatusBadge variant="neutral" label="Belum Submit Absen" />,
    },
  ];

  const departmentColumns: TableColumn<DepartmentBreakdown>[] = [
    {
      key: 'code',
      header: 'Kode Divisi',
      render: (d) => <span className="mono-code">{d.code}</span>,
    },
    {
      key: 'name',
      header: 'Nama Departemen',
      render: (d) => <strong>{d.name}</strong>,
    },
    {
      key: 'total',
      header: 'Karyawan Aktif',
      align: 'center',
      render: (d) => <span className="tabular-nums" style={{ fontWeight: 600 }}>{d.totalEmployees}</span>,
    },
    {
      key: 'present',
      header: 'Hadir WFH',
      align: 'center',
      render: (d) => (
        <span className="tabular-nums" style={{ color: 'var(--success-text)', fontWeight: 600 }}>
          {d.presentCount}
        </span>
      ),
    },
    {
      key: 'onTime',
      header: 'Tepat Waktu',
      align: 'center',
      render: (d) => <span className="tabular-nums">{d.onTimeCount}</span>,
    },
    {
      key: 'late',
      header: 'Terlambat',
      align: 'center',
      render: (d) => (
        <span
          className="tabular-nums"
          style={{ color: d.lateCount > 0 ? 'var(--warning-text)' : 'inherit', fontWeight: d.lateCount > 0 ? 600 : 'normal' }}
        >
          {d.lateCount}
        </span>
      ),
    },
    {
      key: 'missing',
      header: 'Belum Absen',
      align: 'center',
      render: (d) => (
        <span
          className="tabular-nums"
          style={{ color: d.missingCount > 0 ? 'var(--danger-text)' : 'inherit', fontWeight: d.missingCount > 0 ? 600 : 'normal' }}
        >
          {d.missingCount}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Tingkat Kehadiran',
      align: 'right',
      render: (d) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span className="tabular-nums" style={{ fontWeight: 600 }}>{d.attendanceRate}%</span>
          <StatusBadge
            variant={d.attendanceRate >= 80 ? 'success' : d.attendanceRate >= 50 ? 'warning' : 'danger'}
            label={d.attendanceRate >= 80 ? 'Optimal' : d.attendanceRate >= 50 ? 'Cukup' : 'Rendah'}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-label">Karyawan Aktif</div>
          <div className="summary-value">{summary?.totalActiveEmployees ?? 0}</div>
          <div className="summary-note">Terdaftar pada master data</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Hadir ({formatDateYmdToId(summary?.date || todayYmd)})</div>
          <div className="summary-value" style={{ color: 'var(--success-text)' }}>
            {summary?.presentCount ?? 0}
          </div>
          <div className="summary-note">
            Tepat waktu: {summary?.onTimeCount ?? 0} &bull; Terlambat: {summary?.lateCount ?? 0}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Sudah Absen Pulang</div>
          <div className="summary-value">{summary?.clockedOutCount ?? 0}</div>
          <div className="summary-note">Pada tanggal terpilih</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Belum Submit Absen</div>
          <div className="summary-value" style={{ color: 'var(--danger-text)' }}>
            {summary?.notYetClockedInCount ?? 0}
          </div>
          <div className="summary-note">Per tanggal {formatDateYmdToId(summary?.date || todayYmd)}</div>
        </div>
      </div>

      <div className="section-tabs">
        <button
          type="button"
          className={`section-tab ${activeTab === 'submitted' ? 'active' : ''}`}
          onClick={() => setActiveTab('submitted')}
        >
          Log Presensi Disubmit ({meta.total})
        </button>
        <button
          type="button"
          className={`section-tab ${activeTab === 'department' ? 'active' : ''}`}
          onClick={() => setActiveTab('department')}
        >
          Rekapitulasi per Departemen ({summary?.departmentBreakdown?.length ?? 0})
        </button>
        <button
          type="button"
          className={`section-tab ${activeTab === 'missing' ? 'active' : ''}`}
          onClick={() => setActiveTab('missing')}
        >
          Belum Absen Tanggal {formatDateYmdToId(summary?.date || todayYmd)} (
          {summary?.notYetClockedInCount ?? 0})
        </button>
      </div>

      {activeTab === 'submitted' ? (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Kontrol Presensi WFH Karyawan (View Only)</div>
              <div className="panel-subtitle">
                Mode pengawasan HRD — data waktu dan bukti foto presensi karyawan bersifat baca-saja.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              disabled={exporting || rows.length === 0}
            >
              <Download size={14} />
              {exporting ? 'Mengunduh...' : 'Export CSV'}
            </button>
          </div>

          <div className="filter-bar">
            <div className="filter-group" style={{ minWidth: '200px', flex: 1 }}>
              <label>Cari Nama / NIK</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ketik nama atau NIK..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="filter-group">
              <label>Dari Tanggal</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '148px' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="filter-group">
              <label>Sampai Tanggal</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '148px' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="filter-group">
              <label>Departemen</label>
              <select
                className="form-select"
                style={{ width: '175px' }}
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Ketepatan</label>
              <select
                className="form-select"
                style={{ width: '140px' }}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua</option>
                <option value="ON_TIME">Tepat Waktu</option>
                <option value="LATE">Terlambat</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status Pulang</label>
              <select
                className="form-select"
                style={{ width: '145px' }}
                value={completion}
                onChange={(e) => {
                  setCompletion(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua</option>
                <option value="WORKING">Masih Bekerja</option>
                <option value="COMPLETED">Sudah Pulang</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              title="Reset filter"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <DataTable
            columns={submittedColumns}
            data={rows}
            keyExtractor={(r) => r.id}
            loading={loading}
            emptyMessage="Tidak ada data presensi yang sesuai dengan filter pencarian."
          />

          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      ) : activeTab === 'department' ? (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                Rekapitulasi Kehadiran WFH per Departemen ({formatDateYmdToId(summary?.date || todayYmd)})
              </div>
              <div className="panel-subtitle">
                Distribusi karyawan aktif, jumlah kehadiran tepat waktu vs terlambat, serta tingkat kehadiran masing-masing divisi.
              </div>
            </div>
          </div>

          <DataTable
            columns={departmentColumns}
            data={summary?.departmentBreakdown || []}
            keyExtractor={(d) => d.departmentId}
            emptyMessage="Belum ada data rekapitulasi departemen."
          />
        </div>
      ) : (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                Daftar Karyawan Aktif yang Belum Absen ({formatDateYmdToId(summary?.date || todayYmd)})
              </div>
              <div className="panel-subtitle">
                Ubah filter &ldquo;Sampai Tanggal&rdquo; pada tab sebelumnya untuk memeriksa tanggal lain.
              </div>
            </div>
          </div>

          <DataTable
            columns={missingColumns}
            data={summary?.missingEmployees || []}
            keyExtractor={(e) => e.id}
            emptyMessage="Seluruh karyawan aktif telah melakukan presensi pada tanggal ini."
          />
        </div>
      )}

      <AttendanceDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
};

