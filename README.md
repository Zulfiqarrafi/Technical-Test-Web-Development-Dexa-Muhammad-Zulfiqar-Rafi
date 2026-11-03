# Technical Test Web Development — Dexa Group

**Kandidat:** Muhammad Zulfiqar Rafi  
**Posisi:** Fullstack Web Developer  
**Repository:** [GitHub Repository](https://github.com/Zulfiqarrafi/Technical-Test-Web-Development-Dexa-Muhammad-Zulfiqar-Rafi)  
**Dokumentasi Proyek:** Sistem Presensi WFH & Monitoring Karyawan (Satu Direktori Terpadu)

---

## Ringkasan Proyek

Aplikasi web internal terintegrasi untuk pencatatan presensi *Work From Home* (WFH) karyawan beserta modul administrasi data master karyawan dan kontrol absensi oleh HRD, dikembangkan sesuai seluruh instruksi dan spesifikasi teknis Dexa Group.

---

## Ringkasan Pemenuhan Spesifikasi

1. **Backend (`NestJS` + `TypeScript`)**
   - **Arsitektur Microservices**: Memisahkan layanan menjadi `API Gateway` (`HTTP :3000`), `Employee & Auth Microservice` (`TCP :4001`), dan `Attendance Microservice` (`TCP :4002`) menggunakan `@nestjs/microservices` (`Transport.TCP`, `@MessagePattern`, dan `ClientProxy`).
   - **Multi-Database Support (`TypeORM`)**: Mendukung koneksi langsung ke **MySQL** (utama), **Oracle**, **PostgreSQL**, **SQL Server**, serta fallback otomatis ke database lokal (`database/dexa_wfh.sqlite`) apabila service MySQL lokal belum dinyalakan.
   - **Manipulasi Data Penuh (CRUD)**: Operasi Create, Read, Update, dan Delete pada data master karyawan (`/api/employees`) dengan validasi DTO (`class-validator`), autentikasi JWT, dan pembatasan hak akses berbasis role (`EMPLOYEE` vs `HRD`).
   - **Validasi Presensi & Upload Bukti Foto**: Waktu presensi diambil langsung dari jam server (`Asia/Jakarta` WIB) untuk mencegah manipulasi jam perangkat, dilengkapi penyimpanan bukti foto WFH melalui `Multer`.

2. **Frontend (`React.js` + `TypeScript` + `Vite`)**
   - **Aplikasi Absensi WFH Karyawan**: Login menggunakan Email atau NIK, tampilan jam WIB real-time tersinkronisasi server, pengambilan foto bukti kerja melalui kamera browser (`WebRTC`) maupun unggah file gambar, absen masuk & absen pulang, serta riwayat presensi bulanan.
   - **Aplikasi Monitoring Karyawan (HRD)**: Pengelolaan master karyawan (Tambah, Lihat, Ubah, Hapus) serta halaman kontrol absensi karyawan yang bersifat **baca-saja (*view-only*)**, lengkap dengan filter tanggal/departemen/status, rekapitulasi kehadiran per divisi/departemen, pemantauan karyawan yang belum absen hari ini, inspeksi foto bukti WFH, dan ekspor laporan CSV.
   - **Custom Components**: `PhotoCaptureInput`, `DataTable`, `Pagination`, `Modal`, `LiveClock`, `StatusBadge`, `FormField`, dan `AttendanceDetailModal`.

---

## Struktur Proyek (Single Unified Repository)

Seluruh kode backend, microservices, skema database, dan frontend berada dalam satu direktori utama dengan satu `package.json`:

```text
.
├── database/
│   ├── schema.mysql.sql            # Skema DDL MySQL 8.0+
│   └── schema.oracle.sql           # Skema DDL Oracle Database
├── server/
│   ├── common/                     # Guards, Decorators, Exception Filter, Helper RPC & WIB
│   ├── database/                   # Konfigurasi Multi-DB TypeORM, Entities, & Seed Data
│   ├── gateway/                    # HTTP API Gateway (Auth, Employees, Attendance, Upload)
│   ├── services/
│   │   ├── employee-service/       # Microservice Master Karyawan & Auth (TCP :4001)
│   │   └── attendance-service/     # Microservice Presensi & Monitoring (TCP :4002)
│   ├── app.module.ts
│   ├── main.ts                     # Entrypoint Hybrid (Gateway + TCP Microservices)
│   ├── ms-employee.main.ts         # Entrypoint mandiri Employee Microservice
│   └── ms-attendance.main.ts       # Entrypoint mandiri Attendance Microservice
├── web/
│   ├── api/                        # HTTP Client & modul pemanggilan REST API
│   ├── components/                 # Custom React Components & Layout
│   ├── context/                    # State autentikasi (AuthContext)
│   ├── pages/                      # Halaman Login, Presensi, Riwayat, Monitoring, Karyawan, Akun
│   ├── styles/                     # Design tokens & stylesheet aplikasi
│   └── utils/                      # Pemformatan tanggal/waktu WIB
├── uploads/attendance/             # Direktori penyimpanan foto bukti WFH
├── docker-compose.yml              # Konfigurasi opsional container MySQL 8.0
├── package.json
└── vite.config.ts
```

---

## Cara Menjalankan Aplikasi

### 1. Instalasi Dependensi

```bash
npm install
```

### 2. Konfigurasi Database (`.env`)

Secara bawaan aplikasi dikonfigurasi untuk terhubung ke **MySQL** (`127.0.0.1:3306`, database `dexa_wfh_db`).
- Jika MySQL (XAMPP / Laragon / Docker) aktif, aplikasi otomatis membuat database `dexa_wfh_db`, menyinkronkan tabel, dan mengisi data sampel awal.
- Jika MySQL belum dinyalakan dan `DB_FALLBACK_LOCAL=true`, aplikasi otomatis menggunakan file SQL lokal (`database/dexa_wfh.sqlite`) sehingga aplikasi tetap langsung dapat diuji tanpa kendala.
- Untuk menjalankan MySQL melalui Docker (opsional):

```bash
docker compose up -d
```

### 3. Menjalankan Mode Pengembangan

Menjalankan NestJS (API Gateway + Employee Microservice + Attendance Microservice) dan React Vite secara bersamaan:

```bash
npm run dev
```

- **Web Application**: http://localhost:5173
- **API Gateway**: http://localhost:3000/api/health

### 4. Build & Menjalankan Mode Produksi (Satu Port)

```bash
npm run build
npm start
```

Pada mode produksi, seluruh aplikasi web dan REST API disajikan langsung melalui **http://localhost:3000**.

---

## Akun Pengujian Awal (Seed Data)

| Peran | Email | NIK | Password |
| :--- | :--- | :--- | :--- |
| **Admin HRD** | `hrd@dexagroup.com` | `DXG-21001` | `password123` |
| **Karyawan (Belum Absen Hari Ini)** | `budi.santoso@dexagroup.com` | `DXG-22014` | `password123` |
| **Karyawan (Sudah Absen Masuk)** | `siti.rahmawati@dexagroup.com` | `DXG-22038` | `password123` |

---

## Daftar Endpoint Utama (API Gateway)

| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Publik | Status kesehatan sistem & topologi TCP microservices |
| `POST` | `/api/auth/login` | Publik | Login dengan Email/NIK & Password, mengembalikan JWT |
| `GET` | `/api/auth/me` | Login | Mengambil profil pengguna aktif |
| `PATCH` | `/api/auth/change-password` | Login | Mengubah password pengguna aktif |
| `GET` | `/api/departments` | Login | Daftar master departemen |
| `GET` | `/api/employees` | `HRD` | Daftar karyawan (pencarian, filter, paginasi) |
| `POST` | `/api/employees` | `HRD` | Menambah data karyawan baru |
| `PATCH` | `/api/employees/:id` | `HRD` | Memperbarui data karyawan |
| `DELETE` | `/api/employees/:id` | `HRD` | Menghapus data karyawan |
| `GET` | `/api/attendance/today` | Login | Status presensi hari ini & ringkasan bulan berjalan |
| `POST` | `/api/attendance/clock-in` | Login | Submit absen masuk + upload foto bukti WFH (`multipart/form-data`) |
| `POST` | `/api/attendance/clock-out` | Login | Submit absen pulang + catatan/foto penutup |
| `GET` | `/api/attendance/my-history` | Login | Riwayat presensi pribadi |
| `GET` | `/api/attendance/monitoring/summary` | `HRD` | Ringkasan kehadiran harian & daftar belum absen |
| `GET` | `/api/attendance/monitoring` | `HRD` | Kontrol daftar presensi seluruh karyawan (*view-only*) |
| `GET` | `/api/attendance/monitoring/:id` | `HRD` | Detail presensi & foto bukti WFH (*view-only*) |

