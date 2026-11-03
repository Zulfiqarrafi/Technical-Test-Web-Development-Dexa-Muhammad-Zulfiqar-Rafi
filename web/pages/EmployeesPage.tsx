import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { employeesApi, UpsertEmployeeInput } from '../api/employees.api';
import { DataTable, TableColumn } from '../components/ui/DataTable';
import { FormField } from '../components/ui/FormField';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Department, Employee, PaginationMeta, UserRole } from '../types';
import { formatDateYmdToId, getTodayWibYmd } from '../utils/format';

interface EmployeeFormState {
  nik: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  position: string;
  departmentId: string;
  role: UserRole;
  workLocation: string;
  joinDate: string;
  isActive: boolean;
}

const EMPTY_FORM: EmployeeFormState = {
  nik: '',
  fullName: '',
  email: '',
  password: '',
  phone: '',
  position: '',
  departmentId: '',
  role: 'EMPLOYEE',
  workLocation: '',
  joinDate: getTodayWibYmd(),
  isActive: true,
};

export const EmployeesPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Modal Form Create / Update
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    employeesApi.getDepartments().then(setDepartments).catch(() => undefined);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesApi.getAll({
        search: search || undefined,
        departmentId: departmentFilter || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
        page,
        limit: 10,
      });
      setRows(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    const defaultDept = departments[0]?.id ? String(departments[0].id) : '';
    const randNum = String(Math.floor(100 + Math.random() * 900));
    setForm({
      ...EMPTY_FORM,
      nik: `DXG-26${randNum}`,
      departmentId: defaultDept,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({
      nik: emp.nik,
      fullName: emp.fullName,
      email: emp.email,
      password: '',
      phone: emp.phone || '',
      position: emp.position,
      departmentId: String(emp.departmentId),
      role: emp.role,
      workLocation: emp.workLocation || '',
      joinDate: emp.joinDate,
      isActive: emp.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.departmentId) {
      setFormError('Silakan pilih departemen.');
      return;
    }

    if (!editingEmployee && form.password.trim().length < 6) {
      setFormError('Password awal wajib diisi minimal 6 karakter.');
      return;
    }

    setSaving(true);
    try {
      const payload: UpsertEmployeeInput = {
        nik: form.nik.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        departmentId: Number(form.departmentId),
        role: form.role,
        workLocation: form.workLocation.trim(),
        joinDate: form.joinDate,
        isActive: form.isActive,
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (editingEmployee) {
        await employeesApi.update(editingEmployee.id, payload);
        setBanner({
          type: 'success',
          text: `Data karyawan ${payload.fullName} berhasil diperbarui.`,
        });
      } else {
        await employeesApi.create(payload);
        setBanner({
          type: 'success',
          text: `Karyawan baru ${payload.fullName} (${payload.nik}) berhasil ditambahkan.`,
        });
      }

      setModalOpen(false);
      await fetchEmployees();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data karyawan.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await employeesApi.remove(deleteTarget.id);
      setBanner({ type: 'success', text: res.message });
      setDeleteTarget(null);
      await fetchEmployees();
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: err?.message || 'Gagal menghapus data karyawan.',
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<Employee>[] = [
    {
      key: 'nik',
      header: 'NIK',
      render: (e) => <span className="mono-code">{e.nik}</span>,
    },
    {
      key: 'name',
      header: 'Nama & Email',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 600 }}>{e.fullName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.email}</div>
        </div>
      ),
    },
    {
      key: 'dept',
      header: 'Departemen & Jabatan',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 500 }}>{e.department?.name || '-'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.position}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Domisili WFH',
      render: (e) => e.workLocation || '—',
    },
    {
      key: 'joinDate',
      header: 'Tgl Bergabung',
      render: (e) => formatDateYmdToId(e.joinDate),
    },
    {
      key: 'role',
      header: 'Hak Akses',
      render: (e) => (
        <StatusBadge
          variant={e.role === 'HRD' ? 'info' : 'neutral'}
          label={e.role === 'HRD' ? 'Admin HRD' : 'Karyawan'}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <StatusBadge
          variant={e.isActive ? 'success' : 'neutral'}
          label={e.isActive ? 'Aktif' : 'Nonaktif'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (e) => (
        <div style={{ display: 'inline-flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => openEditModal(e)}
          >
            <Pencil size={13} />
            Ubah
          </button>
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            disabled={e.id === currentUser?.id}
            title={
              e.id === currentUser?.id
                ? 'Akun sendiri tidak dapat dihapus'
                : 'Hapus data karyawan'
            }
            onClick={() => setDeleteTarget(e)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {banner && (
        <div
          className={`alert ${banner.type === 'success' ? 'alert-success' : 'alert-error'}`}
        >
          {banner.text}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Master Data Karyawan</div>
            <div className="panel-subtitle">
              Kelola penambahan data karyawan baru, perubahan jabatan/status, serta hak akses sistem.
            </div>
          </div>

          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={15} />
            Tambah Karyawan
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
            <label>Cari Karyawan</label>
            <input
              type="text"
              className="form-input"
              placeholder="Cari berdasarkan nama, NIK, email, atau jabatan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <label>Departemen</label>
            <select
              className="form-select"
              style={{ width: '185px' }}
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
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
            <label>Role Sistem</label>
            <select
              className="form-select"
              style={{ width: '145px' }}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Role</option>
              <option value="EMPLOYEE">Karyawan</option>
              <option value="HRD">Admin HRD</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status Kerja</label>
            <select
              className="form-select"
              style={{ width: '140px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(e) => e.id}
          loading={loading}
          emptyMessage="Data karyawan tidak ditemukan."
        />

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Modal Tambah / Update Karyawan */}
      <Modal
        open={modalOpen}
        title={
          editingEmployee
            ? `Ubah Data Karyawan — ${editingEmployee.nik}`
            : 'Tambah Data Karyawan Baru'
        }
        size="md"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              form="employee-upsert-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : editingEmployee
                  ? 'Simpan Perubahan'
                  : 'Simpan Karyawan'}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error">{formError}</div>}

        <form id="employee-upsert-form" onSubmit={handleSave}>
          <div className="form-grid-2">
            <FormField label="Nomor Induk Karyawan (NIK)" required>
              <input
                type="text"
                className="form-input"
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                placeholder="DXG-26001"
                required
              />
            </FormField>

            <FormField label="Tanggal Bergabung" required>
              <input
                type="date"
                className="form-input"
                value={form.joinDate}
                onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField label="Nama Lengkap" required>
            <input
              type="text"
              className="form-input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nama lengkap sesuai identitas"
              required
            />
          </FormField>

          <div className="form-grid-2">
            <FormField label="Email Korporat" required>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@dexagroup.com"
                required
              />
            </FormField>

            <FormField label="No. Telepon / WhatsApp">
              <input
                type="text"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0812xxxxxxxx"
              />
            </FormField>
          </div>

          <div className="form-grid-2">
            <FormField label="Departemen" required>
              <select
                className="form-select"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                required
              >
                <option value="">-- Pilih Departemen --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Jabatan / Posisi" required>
              <input
                type="text"
                className="form-input"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Contoh: QA Analyst"
                required
              />
            </FormField>
          </div>

          <FormField label="Alamat / Lokasi Pelaksanaan WFH">
            <input
              type="text"
              className="form-input"
              value={form.workLocation}
              onChange={(e) => setForm({ ...form, workLocation: e.target.value })}
              placeholder="Kecamatan, Kota/Kabupaten"
            />
          </FormField>

          <div className="form-grid-2">
            <FormField label="Role Akses Sistem" required>
              <select
                className="form-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                <option value="EMPLOYEE">Karyawan</option>
                <option value="HRD">Admin HRD</option>
              </select>
            </FormField>

            <FormField label="Status Kepegawaian" required>
              <select
                className="form-select"
                value={form.isActive ? 'true' : 'false'}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === 'true' })
                }
                disabled={editingEmployee?.id === currentUser?.id}
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </FormField>
          </div>

          <FormField
            label={editingEmployee ? 'Reset Password (Opsional)' : 'Password Awal Akun'}
            required={!editingEmployee}
            hint={
              editingEmployee
                ? 'Kosongkan apabila tidak ingin mengubah password karyawan.'
                : 'Minimal 6 karakter untuk login pertama kali.'
            }
          >
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={
                editingEmployee ? 'Biarkan kosong jika tetap' : 'Minimal 6 karakter'
              }
            />
          </FormField>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Konfirmasi Penghapusan Karyawan"
        size="sm"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus Data'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Apakah Anda yakin ingin menghapus data karyawan{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {deleteTarget?.fullName} ({deleteTarget?.nik})
          </strong>
          ? Seluruh riwayat presensi terkait karyawan ini juga akan terhapus secara permanen.
        </p>
      </Modal>
    </>
  );
};

