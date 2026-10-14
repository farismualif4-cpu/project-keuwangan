# 🚀 Sprint Plan 30 Hari - Project FinTrack

Rencana kerja sprint berdurasi **30 hari** untuk pengembangan aplikasi manajemen keuangan **FinTrack** secara menyeluruh dari tahap frontend MVP, backend, integrasi full-stack, hingga deployment produksi.

---

## 📅 Struktur Alokasi Waktu (Timeline)

| Sprint | Rentang Waktu | Fokus Utama | Status |
|:---:|:---:|---|:---:|
| **Sprint 1** | **Hari 1 – 10** | **Fondasi Frontend, UI/UX, Grafik & State Client (MVP)** | **[X] SELESAI** |
| **Sprint 2** | **Hari 11 – 20** | **Arsitektur Backend, Skema Database & Autentikasi JWT** | **[X] SELESAI** |
| **Sprint 3** | **Hari 21 – 30** | **Integrasi Full-Stack, QA Testing, CI/CD & Deploy Produksi** | **[ ] SEDANG BERJALAN (83% Total Proyek)** |

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
> **Status**: **[X] SELESAI (100% — Terverifikasi dengan 268 Assertion)**

---

### [X] TASK-09: Desain Skema Database Relasional & Migrasi
- **Sprint**: Sprint 2 (Hari 11 – 12)
- **Label**: `backend`, `database`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Merancang ERD dan tabel relasional database menggunakan ORM Prisma untuk persistensi multi-user.
- **Subtask**:
  - [X] Rancang model `users` (id, email, passwordHash, name, createdAt, updatedAt)
  - [X] Rancang model `wallets` (id, userId, name, type, initialBalance, color, icon)
  - [X] Rancang model `categories` (id, userId, name, type, icon, color, isSystem)
  - [X] Rancang model `transactions` (id, userId, wallet, category, amount, type, date, description)
  - [X] Rancang model `budgets` (id, userId, categoryId, amount, period)
  - [X] Rancang model `refresh_tokens` untuk rotasi dan pencabutan sesi aman
  - [X] Buat skrip migrasi awal dan database seeder untuk kategori default (`seedCategories.js`)

---

### [X] TASK-10: Inisialisasi REST API Server & Arsitektur Layered
- **Sprint**: Sprint 2 (Hari 12 – 13)
- **Label**: `backend`, `api`
- **Story Point**: 3 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Menyiapkan server backend Node.js + Express dengan arsitektur controller-routes-middleware yang modular dan bersih.
- **Subtask**:
  - [X] Setup server `server.js`, file environment `.env`, dan skrip npm start/dev
  - [X] Konfigurasi CORS dinamis (dukungan localhost & port dev), cookie parser, dan JSON parser
  - [X] Pasang request logger middleware konsol HTTP
  - [X] Standardisasi format respons API (`success`, `data`, `message`, `pagination`)
  - [X] Setup central error handling & 404 handler (`errorHandler.js`)

---

### [X] TASK-11: Sistem Autentikasi Pengguna & Keamanan Token
- **Sprint**: Sprint 2 (Hari 14 – 16)
- **Label**: `backend`, `security`, `auth`
- **Story Point**: 8 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Mengimplementasikan registrasi, login, hashing password Bcrypt, dan manajemen JWT (Access Token in-memory & Refresh Token HttpOnly).
- **Subtask**:
  - [X] Buat endpoint `POST /api/auth/register` dengan validasi email unik dan format kredensial
  - [X] Hash password menggunakan Bcrypt (salt rounds 10+) tanpa kebocoran hash di response
  - [X] Buat endpoint `POST /api/auth/login` yang menghasilkan JWT access token
  - [X] Simpan Refresh Token di HttpOnly secure cookie (`fintrack_refresh_token`)
  - [X] Buat endpoint `POST /api/auth/refresh` dengan token rotation & reuse detection (RFC 6749)
  - [X] Buat endpoint `POST /api/auth/logout` untuk mencabut sesi di database & membersihkan cookie
  - [X] Pasang middleware verifikasi JWT `requireAuth` / `authenticateToken` pada endpoint terproteksi
  - [X] Pasang proteksi CSRF token (`fintrack_csrf_token`) & verifikasi origin

---

### [X] TASK-12: API Endpoint Transaksi & Dompet
- **Sprint**: Sprint 2 (Hari 16 – 18)
- **Label**: `backend`, `api`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Membangun endpoint CRUD transaksi lengkap dengan validasi data ketat dan isolasi data per akun pengguna.
- **Subtask**:
  - [X] `GET /api/transactions` dengan paginasi, filter tanggal, tipe, dompet, kategori, search, dan sorting
  - [X] `POST /api/transactions` dengan validasi nominal > 0
  - [X] `PUT /api/transactions/:id` untuk update mutasi transaksi
  - [X] `DELETE /api/transactions/:id` untuk hapus mutasi transaksi
  - [X] Endpoint CRUD dompet rekening `GET/POST/PUT/DELETE /api/wallets`
  - [X] Proteksi integritas relasi transaksi saat penghapusan dompet (menolak hapus dompet yang masih memiliki mutasi)

---

### [X] TASK-13: API Endpoint Kategori, Anggaran & Agregasi Finansial
- **Sprint**: Sprint 2 (Hari 19 – 20)
- **Label**: `backend`, `api`, `database`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Menyediakan endpoint untuk manajemen anggaran dan endpoint agregasi analitik untuk grafik dashboard.
- **Subtask**:
  - [X] Endpoint CRUD kategori kustom pengguna `/api/categories` & proteksi kategori sistem dari perubahan (403 Forbidden)
  - [X] Endpoint set/update batas anggaran bulanan `/api/budgets`
  - [X] Endpoint agregasi dashboard `/api/analytics/summary` (total saldo dompet, pemasukan, pengeluaran, net cashflow, savings rate)
  - [X] Endpoint analitik tren bulanan & arus kas harian
  - [X] Endpoint distribusi kategori (`categoryBreakdown`) & deteksi kuantitas anggaran terlampaui (`exceededBudgetCount`)

---

## 🏃 Sprint 3 (Hari 21 – 30): Integrasi Full-Stack, Fitur Lanjutan, QA & Deployment
> **Target**: Menghubungkan client dan server, melengkapi fitur produktivitas lanjutan, menguji stabilitas, dan merilis aplikasi ke server cloud.  
> **Status**: **[ ] SEDANG BERJALAN (Tahap Integrasi, Auth UI, Analitik & QA Telah Selesai)**

---

### [X] TASK-14: Integrasi Client-Server via Service Layer & FetchWithAuth
- **Sprint**: Sprint 3 (Hari 21 – 23)
- **Label**: `frontend`, `integration`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Menghubungkan client frontend ke backend REST API secara aman menggunakan `fetchWithAuth`, manajemen access token in-memory, dan auto-refresh token.
- **Subtask**:
  - [X] Setup modul client API [`fintrack/src/services/api.js`](file:///d:/month-4/project-keuwangan/fintrack/src/services/api.js) dengan penyisipan Authorization Bearer Token
  - [X] Pasang auto-refresh token transparan saat client mendeteksi respons HTTP 401
  - [X] Sinkronisasi state domain transaksi, dompet, anggaran, dan kategori ke database backend
  - [X] Hubungkan kalkulasi dompet dinamis tanpa double counting (`dynamicWallets`)
  - [X] Tampilkan loading state, empty state, dan feedback error responsif

---

### [X] TASK-15: Halaman Autentikasi Pengguna di Frontend
- **Sprint**: Sprint 3 (Hari 23 – 24)
- **Label**: `frontend`, `auth`, `ui/ux`
- **Story Point**: 3 SP
- **Status**: `[X] SELESAI`
- **Deskripsi**: Merancang halaman Login dan Register yang aman dengan validasi form, silent session refresh, dan navigasi terproteksi.
- **Subtask**:
  - [X] Buat halaman `AuthPage.jsx` dengan tab Masuk dan Daftar
  - [X] Form registrasi dengan validasi nama lengkap, email, dan password minimal 6 karakter
  - [X] Proteksi routing: otomatis menampilkan AuthPage jika belum login dan memuat Dashboard setelah autentikasi
  - [X] Simpan profil user dan status token di memory auth context (`FinanceContext`)
  - [X] Tambahkan tombol quick demo login untuk mempermudah evaluasi

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
- **Status**: `[ ] BELUM DIKERJAKAN` *(Catatan: Ekspor CSV terproteksi CWE-1236 & Cadangan Penuh JSON atomik sudah selesai di Tahap 6)*
- **Deskripsi**: Fitur mencetak lembar rekap laporan bulanan ke format dokumen PDF resmi dan scan nota belanja.
- **Subtask**:
  - [ ] Fitur generate PDF laporan bulanan dengan kop dan tabel rincian mutasi
  - [ ] Input upload foto struk kasir
  - [ ] Integrasi OCR scanner untuk ekstraksi otomatis nominal dan tanggal struk

---

### [X] TASK-18: Quality Assurance, Automated Testing & Security Audit
- **Sprint**: Sprint 3 (Hari 28 – 29)
- **Label**: `qa`, `testing`, `security`
- **Story Point**: 5 SP
- **Status**: `[X] SELESAI (268 Assertion Lulus 100%)`
- **Deskripsi**: Melakukan pengujian otomatis (Unit, Integration, E2E functional) serta audit celah keamanan web FinTrack.
- **Subtask**:
  - [X] Pengujian formula saldo matematis, kalkulasi dompet dinamis, dan formatting Rupiah
  - [X] Integration testing rute REST API lengkap (Tahap 1 s/d Tahap 7: 268 assertion PASS)
  - [X] Pengujian fungsional terintegrasi (Autentikasi, Mutasi Transaksi, Cadangan Atomik, Dashboard Analitik)
  - [X] Audit keamanan OWASP (Perlindungan Formula Injection CSV CWE-1236, Multi-tenant Isolation, Token Reuse RFC 6749, CSRF, Bcrypt Hashing)

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
  - [ ] Deploy backend API & database ke Railway / Render
  - [ ] Konfigurasi domain kustom dan sertifikat SSL HTTPS aktif

---

## 📈 Ringkasan Story Point & Burn-down

| Kategori | Sprint 1 (Hari 1-10) | Sprint 2 (Hari 11-20) | Sprint 3 (Hari 21-30) | Total |
|---|:---:|:---:|:---:|:---:|
| **Frontend** | 34 SP | 0 SP | 8 SP | **42 SP** |
| **Backend & DB** | 0 SP | 26 SP | 0 SP | **26 SP** |
| **Fullstack & QA/DevOps** | 0 SP | 0 SP | 20 SP | **20 SP** |
| **Total Story Points** | **34 SP** | **26 SP** | **28 SP** | **88 SP** |
| **Status Realisasi** | **[X] 34 SP Selesai** | **[X] 26 SP Selesai** | **[X] 13 SP Selesai** | **[X] 73 SP / 88 SP Selesai (83.0%)** |

---

## 🏆 Kriteria Penyelesaian (Definition of Done)
Sebuah task diberi tanda **`[X]`** hanya jika:
1. Kode sumber telah diimplementasikan dan berjalan tanpa error.
2. Desain responsif diuji di resolusi desktop dan mobile.
3. Seluruh subtask di dalam task tersebut telah selesai dikerjakan (`[X]`).
4. Kode terbebas dari lint error dan lulus pengujian lokal (268 assertion lulus).
