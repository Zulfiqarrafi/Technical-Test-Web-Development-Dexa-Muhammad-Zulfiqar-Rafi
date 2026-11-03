-- ============================================================================
-- DEXA GROUP - SISTEM PRESENSI WFH & MONITORING KARYAWAN
-- Database Schema : MySQL 8.0+
-- Charset         : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `dexa_wfh_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `dexa_wfh_db`;

-- ----------------------------------------------------------------------------
-- 1. Tabel Master Departemen / Divisi
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_departments_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Tabel Master Karyawan & Akun Pengguna
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nik` VARCHAR(30) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(25) NULL,
  `position` VARCHAR(100) NOT NULL,
  `department_id` INT UNSIGNED NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE' COMMENT 'EMPLOYEE | HRD',
  `work_location` VARCHAR(200) NULL COMMENT 'Alamat domisili / lokasi pelaksanaan WFH',
  `join_date` VARCHAR(10) NOT NULL COMMENT 'Format YYYY-MM-DD',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_employees_nik` (`nik`),
  UNIQUE KEY `UQ_employees_email` (`email`),
  KEY `IDX_employees_department` (`department_id`),
  KEY `IDX_employees_role` (`role`),
  KEY `IDX_employees_active` (`is_active`),
  CONSTRAINT `FK_employees_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Tabel Transaksi Absensi WFH Karyawan
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` INT UNSIGNED NOT NULL,
  `attendance_date` VARCHAR(10) NOT NULL COMMENT 'Tanggal presensi WIB (YYYY-MM-DD)',
  `clock_in_time` DATETIME NOT NULL COMMENT 'Waktu absen masuk (server timestamp)',
  `clock_in_photo` VARCHAR(255) NOT NULL COMMENT 'Path bukti foto WFH saat absen masuk',
  `clock_in_note` TEXT NULL COMMENT 'Rencana / aktivitas pekerjaan hari ini',
  `clock_in_ip` VARCHAR(60) NULL,
  `clock_out_time` DATETIME NULL COMMENT 'Waktu absen pulang (server timestamp)',
  `clock_out_photo` VARCHAR(255) NULL COMMENT 'Path bukti foto WFH saat absen pulang',
  `clock_out_note` TEXT NULL COMMENT 'Ringkasan hasil pekerjaan hari ini',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ON_TIME' COMMENT 'ON_TIME | LATE',
  `work_duration_minutes` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_attendances_employee_date` (`employee_id`, `attendance_date`),
  KEY `IDX_attendances_date` (`attendance_date`),
  KEY `IDX_attendances_status` (`status`),
  CONSTRAINT `FK_attendances_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

