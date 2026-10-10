# 🚀 Sprint Plan 30 Hari - Project FinTrack

Rencana kerja sprint berdurasi **30 hari** untuk pengembangan aplikasi manajemen keuangan **FinTrack** secara menyeluruh dari tahap frontend MVP, backend, integrasi full-stack, hingga deployment produksi.

---

## 📅 Struktur Alokasi Waktu (Timeline)

| Sprint | Rentang Waktu | Fokus Utama | Status |
|:---:|:---:|---|:---:|
| **Sprint 1** | **Hari 1 – 10** | **Fondasi Frontend, UI/UX, Grafik & State Client (MVP)** | **[X] SELESAI** |
| **Sprint 2** | **Hari 11 – 20** | **Arsitektur Backend, Skema Database & Autentikasi JWT** | **[ ] TERJADWAL** |
| **Sprint 3** | **Hari 21 – 30** | **Integrasi Full-Stack, QA Testing, CI/CD & Deploy Produksi** | **[ ] TERJADWAL** |

---

## 🏃 Sprint 1 (Hari 1 – 10): Frontend MVP & Client-Side System
> **Target**: Menghasilkan antarmuka responsif, visualisasi grafik, dan manajemen state lokal yang interaktif dan siap pakai.  
> **Status**: **[X] SELESAI (100%)**

---

### [X] TASK-01: Inisialisasi Proyek Frontend & Konfigurasi Build
- **Sprint**: Sprint 1 (Hari 1 – 2)
- **Label**: `frontend`, `setup`
- **Story Point**: 3 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Menyiapkan pondasi proyek React menggunakan Vite, instalasi pustaka icon dan charting, serta konfigurasi environment.
- **Subtask**:
  - [X] Inisialisasi React 19 dengan Vite
  - [X] Setup pustaka `lucide-react` dan `recharts`
  - [X] Konfigurasi path alias `@/` pada `vite.config.js`
  - [X] Setup `index.html` dengan Google Fonts *Plus Jakarta Sans* & Meta SEO

---

### [X] TASK-02: Perancangan Design System & Styling Dasar
- **Sprint**: Sprint 1 (Hari 2 – 3)
- **Label**: `frontend`, `ui/ux`, `css`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Membangun sistem desain Vanilla CSS dengan variabel warna finansial modern, tipografi, efek bayangan lembut (*soft shadows*), dan dukungan responsif mobile/desktop.
- **Subtask**:
  - [X] Definisikan CSS custom properties (warna primary, income green, expense red, warning amber)
  - [X] Buat layout grid dan flexbox responsif
  - [X] Implementasikan card styling dengan subtle border dan elevation
  - [X] Buat styling animasi halus untuk modal dialog dan tombol aksi

---

### [X] TASK-03: Navigasi Sidebar Responsif & Global Header
- **Sprint**: Sprint 1 (Hari 4 – 5)
- **Label**: `frontend`, `ui/ux`
- **Story Point**: 3 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Membuat komponen navigasi sidebar yang sticky untuk desktop, collapsible drawer untuk mobile, serta header dengan informasi tanggal lokal dinamis.
- **Subtask**:
  - [X] Buat komponen `Sidebar.jsx` dengan status menu aktif
  - [X] Tambahkan ringkasan saldo cepat (*quick balance preview*) di sidebar
  - [X] Buat drawer backdrop untuk tampilan ponsel
  - [X] Buat komponen `Header.jsx` dengan tombol shortcut `+ Catat Transaksi` dan ekspor CSV

---

### [X] TASK-04: State Management & Penyimpanan Lokal (FinanceContext)
- **Sprint**: Sprint 1 (Hari 5 – 6)
- **Label**: `frontend`, `state-management`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Mengembangkan global state management menggunakan React Context untuk menangani kalkulasi saldo, data transaksi, batas anggaran, dan sinkronisasi otomatis ke `localStorage`.
- **Subtask**:
  - [X] Buat `FinanceContext.jsx` dengan hook `useFinance()`
  - [X] Implementasikan fungsi penambahan dan penghapusan transaksi
  - [X] Hitung metrik saldo bersih, total pemasukan, total pengeluaran, dan rasio tabungan
  - [X] Buat helper format mata uang Rupiah (`Rp`) dan tanggal lokal Indonesia di `initialData.js`
  - [X] Sinkronisasi state transaksi dan anggaran ke LocalStorage browser

---

### [X] TASK-05: Modal Form Pencatatan Transaksi Baru
- **Sprint**: Sprint 1 (Hari 6 – 7)
- **Label**: `frontend`, `form`
- **Story Point**: 3 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Membuat modal popup untuk input mutasi keuangan harian dengan tab Pemasukan/Pengeluaran dan live preview nominal.
- **Subtask**:
  - [X] Buat komponen `TransactionModal.jsx`
  - [X] Buat tab toggle Pengeluaran dan Pemasukan dengan warna khas
  - [X] Tambahkan live preview format nominal Rupiah saat pengguna mengetik
  - [X] Pilihan dropdown kategori dinamis sesuai tipe transaksi
  - [X] Pilihan dompet/sumber dana (BCA, Mandiri, Tunai, GoPay)
  - [X] Validasi error jika input nominal kosong atau kurang dari 0

---

### [X] TASK-06: Dashboard Eksekutif & Visualisasi Grafik
- **Sprint**: Sprint 1 (Hari 7 – 8)
- **Label**: `frontend`, `charts`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Mengintegrasikan 4 kartu metrik utama, grafik tren arus kas bulanan (*AreaChart*), dan diagram donat alokasi pengeluaran (*PieChart*).
- **Subtask**:
  - [X] Buat 4 kartu metrik (Saldo Bersih, Total Pemasukan, Total Pengeluaran, Savings Rate)
  - [X] Buat komponen `CashflowChart.jsx` menggunakan Recharts dengan custom tooltip
  - [X] Buat komponen `ExpensePieChart.jsx` dengan indikator warna per pos
  - [X] Tampilkan 6 transaksi terbaru dengan aksi hapus instan
  - [X] Tampilkan ringkasan saldo dompet rekening aktif

---

### [X] TASK-07: Halaman Riwayat Transaksi Lengkap
- **Sprint**: Sprint 1 (Hari 8 – 9)
- **Label**: `frontend`, `feature`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Menyediakan tabel riwayat mutasi dengan fitur pencarian teks, filter jenis, filter kategori, pengurutan, dan tombol ekspor berkas CSV.
- **Subtask**:
  - [X] Buat halaman `TransactionsPage.jsx`
  - [X] Implementasikan search bar real-time (cari berdasarkan judul & catatan)
  - [X] Filter mutasi (Semua, Pemasukan, Pengeluaran)
  - [X] Dropdown filter per kategori
  - [X] Fitur sorting (Terbaru, Terlama, Nominal Tertinggi, Nominal Terendah)
  - [X] Fitur unduh rekap mutasi ke format berkas CSV

---

### [X] TASK-08: Halaman Laporan (Analisis 50/30/20) & Manajemen Anggaran
- **Sprint**: Sprint 1 (Hari 9 – 10)
- **Label**: `frontend`, `feature`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Membangun modul evaluasi keuangan sesuai aturan 50/30/20 dan kontrol batas anggaran bulanan per kategori.
- **Subtask**:
  - [X] Buat halaman `ReportsPage.jsx` dengan kalkulator aturan 50/30/20
  - [X] Tampilkan progress bar perbandingan pengeluaran per kategori
  - [X] Buat halaman `BudgetPage.jsx` dengan status badge (Aman / Waspada / Over Limit)
  - [X] Tambahkan fitur inline edit untuk mengubah limit anggaran
  - [X] Buat halaman `SettingsPage.jsx` dengan fitur unduh & unggah cadangan JSON

---

## 🏃 Sprint 2 (Hari 11 – 20): Backend Engine, Database & Autentikasi
> **Target**: Membangun REST API server yang tangguh, skema database relasional, dan sistem otentikasi JWT yang aman.  
> **Status**: **[ ] TERJADWAL**

---

### [ ] TASK-09: Desain Skema Database Relasional & Migrasi
- **Sprint**: Sprint 2 (Hari 11 – 12)
- **Label**: `backend`, `database`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Merancang ERD dan tabel relasional database (PostgreSQL/MySQL) menggunakan ORM (Prisma/Drizzle) untuk persistensi multi-user.
- **Subtask**:
  - [ ] Rancang tabel `users` (id, email, password_hash, name, created_at)
  - [ ] Rancang tabel `wallets` (id, user_id, name, type, balance, color)
  - [ ] Rancang tabel `categories` (id, user_id, name, type, icon, color)
  - [ ] Rancang tabel `transactions` (id, user_id, wallet_id, category_id, amount, type, date, notes)
  - [ ] Rancang tabel `budgets` (id, user_id, category_id, monthly_limit, month_year)
  - [ ] Buat skrip migrasi awal dan database seeder untuk kategori default

---

### [ ] TASK-10: Inisialisasi REST API Server & Arsitektur Layered
- **Sprint**: Sprint 2 (Hari 12 – 13)
- **Label**: `backend`, `api`
- **Story Point**: 3 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Menyiapkan server backend (Node.js/Express atau Golang) dengan arsitektur controller-service-repository yang rapi.
- **Subtask**:
  - [ ] Setup boilerplate server, tsconfig, dan script build
  - [ ] Konfigurasi CORS, Helmet security headers, dan parser middleware
  - [ ] Pasang request logger (Morgan/Winston)
  - [ ] Buat standardisasi format response API (`success`, `data`, `error`, `pagination`)
  - [ ] Setup central error handling middleware

---

### [ ] TASK-11: Sistem Autentikasi Pengguna & Keamanan Token
- **Sprint**: Sprint 2 (Hari 14 – 16)
- **Label**: `backend`, `security`, `auth`
- **Story Point**: 8 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Mengimplementasikan registrasi, login, hashing password, dan manajemen JWT (Access Token & Refresh Token).
- **Subtask**:
  - [ ] Buat endpoint `POST /api/v1/auth/register` dengan validasi email unik
  - [ ] Hash password menggunakan Argon2 / Bcrypt (salt rounds 10+)
  - [ ] Buat endpoint `POST /api/v1/auth/login` yang menghasilkan JWT access token
  - [ ] Simpan Refresh Token di HttpOnly secure cookie
  - [ ] Buat endpoint `POST /api/v1/auth/refresh` untuk pembaruan token otomatis
  - [ ] Buat endpoint `POST /api/v1/auth/logout`
  - [ ] Pasang middleware verifikasi JWT pada rute yang diproteksi
  - [ ] Pasang rate limiting pada endpoint auth untuk mencegah brute-force

---

### [ ] TASK-12: API Endpoint Transaksi & Dompet
- **Sprint**: Sprint 2 (Hari 16 – 18)
- **Label**: `backend`, `api`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Membangun endpoint CRUD transaksi lengkap dengan validasi data ketat dan isolasi data per akun pengguna.
- **Subtask**:
  - [ ] `GET /api/v1/transactions` dengan paginasi, filter tanggal, tipe, dan search
  - [ ] `POST /api/v1/transactions` dengan validasi nominal > 0
  - [ ] `PUT /api/v1/transactions/:id` untuk update mutasi
  - [ ] `DELETE /api/v1/transactions/:id` untuk hapus mutasi
  - [ ] Endpoint CRUD dompet rekening `GET/POST/PUT/DELETE /api/v1/wallets`
  - [ ] Endpoint transfer saldo antar dompet menggunakan database transaction lock

---

### [ ] TASK-13: API Endpoint Kategori, Anggaran & Agregasi Finansial
- **Sprint**: Sprint 2 (Hari 19 – 20)
- **Label**: `backend`, `api`, `database`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Menyediakan endpoint untuk manajemen anggaran dan endpoint agregasi analitik untuk grafik dashboard.
- **Subtask**:
  - [ ] Endpoint CRUD kategori kustom pengguna `/api/v1/categories`
  - [ ] Endpoint set/update batas anggaran bulanan `/api/v1/budgets`
  - [ ] Endpoint agregasi dashboard `/api/v1/analytics/overview` (total saldo, income, expense)
  - [ ] Endpoint analitik tren bulanan `/api/v1/analytics/cashflow-trend`
  - [ ] Endpoint distribusi kategori `/api/v1/analytics/category-breakdown`

---

## 🏃 Sprint 3 (Hari 21 – 30): Integrasi Full-Stack, Fitur Lanjutan, QA & Deployment
> **Target**: Menghubungkan client dan server, melengkapi fitur produktivitas lanjutan, menguji stabilitas, dan merilis aplikasi ke server cloud.  
> **Status**: **[ ] TERJADWAL**

---

### [ ] TASK-14: Integrasi Client-Server via TanStack Query & Axios
- **Sprint**: Sprint 3 (Hari 21 – 23)
- **Label**: `frontend`, `integration`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Mengganti mock LocalStorage dengan server state menggunakan TanStack Query (React Query) dan setup Axios interceptor.
- **Subtask**:
  - [ ] Setup Axios instance dengan interceptor penyisipan Authorization Bearer Token
  - [ ] Pasang auto-refresh token saat client menerima kode status HTTP 401
  - [ ] Pasang `@tanstack/react-query` untuk caching data server
  - [ ] Hubungkan mutasi transaksi dengan optimistic updates (UI update instan)
  - [ ] Tampilkan skeleton shimmer saat fetching data

---

### [ ] TASK-15: Halaman Autentikasi Pengguna di Frontend
- **Sprint**: Sprint 3 (Hari 23 – 24)
- **Label**: `frontend`, `auth`, `ui/ux`
- **Story Point**: 3 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Merancang halaman Login dan Register yang aman dengan validasi form dan pesan error responsif.
- **Subtask**:
  - [ ] Buat halaman `LoginPage.jsx` (email, password, tombol submit, link daftar)
  - [ ] Buat halaman `RegisterPage.jsx` (nama, email, konfirmasi password)
  - [ ] Proteksi routing: redirect ke login jika belum ada sesi aktif
  - [ ] Simpan status user profile di global auth context

---

### [ ] TASK-16: Fitur Mutasi Berulang (Recurring) & Transfer Saldo
- **Sprint**: Sprint 3 (Hari 25 – 26)
- **Label**: `fullstack`, `feature`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Menambahkan otomatisasi pencatatan transaksi berulang bulanan dan transfer antar dompet/bank.
- **Subtask**:
  - [ ] Form input transaksi berulang (tipe frekuensi: bulanan/mingguan)
  - [ ] Cron job backend untuk otomatis mencatat mutasi berulang setiap tanggal jatuh tempo
  - [ ] Modal dialog transfer saldo antar rekening (mengurangi sumber, menambah tujuan)
  - [ ] Notifikasi banner jika anggaran kategori mendekati batas (≥ 80%)

---

### [ ] TASK-17: Ekspor Dokumen PDF Resmi & Ekstraksi Struk (OCR)
- **Sprint**: Sprint 3 (Hari 26 – 27)
- **Label**: `fullstack`, `feature`, `export`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Fitur mencetak lembar rekap laporan bulanan ke format dokumen PDF resmi dan scan nota belanja.
- **Subtask**:
  - [ ] Fitur generate PDF laporan bulanan dengan kop dan tabel rincian mutasi
  - [ ] Input upload foto struk kasir
  - [ ] Integrasi OCR scanner untuk ekstraksi otomatis nominal dan tanggal struk

---

### [ ] TASK-18: Quality Assurance, Automated Testing & Security Audit
- **Sprint**: Sprint 3 (Hari 28 – 29)
- **Label**: `qa`, `testing`, `security`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Melakukan pengujian otomatis (Unit, Integration, E2E) serta audit celah keamanan web.
- **Subtask**:
  - [ ] Unit testing formula matematis saldo dan format Rupiah menggunakan Vitest
  - [ ] Integration testing rute REST API menggunakan Supertest
  - [ ] End-to-End (E2E) testing alur utama (Login -> Tambah Transaksi -> Cek Dashboard)
  - [ ] Audit keamanan OWASP (cegah XSS, SQL Injection, CSRF)

---

### [ ] TASK-19: Dockerization, CI/CD Pipeline & Cloud Deployment
- **Sprint**: Sprint 3 (Hari 29 – 30)
- **Label**: `devops`, `ci/cd`, `deployment`
- **Story Point**: 5 SP
- **Status**: `[ ] BELUM DIKERJAKAN`
- **Deskripsi**: Kontainerisasi aplikasi, pembuatan alur kerja CI/CD otomatis di GitHub Actions, dan peluncuran ke cloud produksi.
- **Subtask**:
  - [ ] Buat `Dockerfile` multi-stage build untuk frontend dan backend
  - [ ] Buat file `docker-compose.yml` untuk lingkungan lokal
  - [ ] Setup GitHub Actions workflow untuk linting dan testing otomatis pada PR
  - [ ] Deploy frontend ke platform hosting Vercel / Cloudflare Pages
  - [ ] Deploy backend API & PostgreSQL ke Railway / Render
  - [ ] Konfigurasi domain kustom dan sertifikat SSL HTTPS aktif

---

## 📈 Ringkasan Story Point & Burn-down

| Kategori | Sprint 1 (Hari 1-10) | Sprint 2 (Hari 11-20) | Sprint 3 (Hari 21-30) | Total |
|---|:---:|:---:|:---:|:---:|
| **Frontend** | 34 SP | 0 SP | 8 SP | **42 SP** |
| **Backend & DB** | 0 SP | 26 SP | 0 SP | **26 SP** |
| **Fullstack & QA/DevOps** | 0 SP | 0 SP | 20 SP | **20 SP** |
| **Total Story Points** | **34 SP** | **26 SP** | **28 SP** | **88 SP** |
| **Status Realisasi** | **[X] 34 SP Selesai** | **[ ] 0 SP Selesai** | **[ ] 0 SP Selesai** | **38.6% Selesai** |

---

## 🏆 Kriteria Penyelesaian (Definition of Done)
Sebuah task diberi tanda **`[X]`** hanya jika:
1. Kode sumber telah diimplementasikan dan berjalan tanpa error.
2. Desain responsif diuji di resolusi desktop dan mobile.
3. Seluruh subtask di dalam task tersebut telah selesai dikerjakan (`[X]`).
4. Kode terbebas dari lint error dan lulus pengujian lokal.
