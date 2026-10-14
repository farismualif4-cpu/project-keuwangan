# FinTrack — Backend Progress Report: Tahap 7 (Dashboard & Analitik Keuangan)

*Tanggal Pelaksanaan*: 13 Oktober 2026  
*Status Pengerjaan*: **Selesai dan Diuji Penuh (100% Assertion Lulus)**  
*Hasil Pengujian Aktual*:
- **Test Suite Tahap 7 (`test-tahap7.js`)**: 55 dari 55 assertion LULUS (100%)
- **Regresi Tahap 6 Ekspor & Impor Data (`test-tahap6.js`)**: 53 dari 53 assertion LULUS (100%)
- **Regresi Tahap 5 Sesi & HttpOnly (`test-tahap5.js`)**: 36 dari 36 assertion LULUS (100%)
- **Regresi Tahap 4 Kategori & Filter (`test-tahap4.js`)**: 45 dari 45 assertion LULUS (100%)
- **Regresi Tahap 3 Dompet & Anggaran (`test-wallets-budgets.js`)**: 32 dari 32 assertion LULUS (100%)
- **Regresi Tahap 2 Autentikasi & Keamanan Data (`test-auth.js`)**: 27 dari 27 assertion LULUS (100%)
- **Regresi Tahap 1 API Transaksi Dasar (`test-api.js`)**: 20 dari 20 assertion LULUS (100%)
- **Total Pengujian Otomatis Keseluruhan**: **268 assertion LULUS (0 Gagal)**
- **Build Frontend (`npm.cmd run build`)**: Berhasil tanpa error (`built in 1.37s`, 0 warning sintaks)

---

## 1. Investigasi & Akar Penyebab Masalah Halaman Putih (Bagian A)

Sebelum penambahan fitur Tahap 7, dilakukan audit menyeluruh pada `main.jsx`, `App.jsx`, `FinanceContext.jsx`, alur inisialisasi autentikasi, CORS, dan siklus render React:

### Akar Masalah yang Ditemukan:
1. **Temporal Dead Zone (TDZ) ReferenceError pada `logout`**:
   - Di [`fintrack/src/context/FinanceContext.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/context/FinanceContext.jsx), hook `useEffect` mendaftarkan callback `setOnUnauthorized` pada baris 130 dengan array dependensi `[logout]`.
   - Namun, deklarasi `const logout = useCallback(...)` baru ditulis di bawahnya (baris 144).
   - Dalam spesifikasi ECMAScript / React 19, variabel yang dideklarasikan dengan `const` berada dalam *Temporal Dead Zone (TDZ)* sebelum inisialisasinya dieksekusi. Mengevaluasi `[logout]` saat eksekusi pertama komponen memicu runtime exception: `ReferenceError: Cannot access 'logout' before initialization`.
2. **Import Fungsi Hilang (`deleteWalletApi`)**:
   - Baris 482 di `FinanceContext.jsx` memanggil `deleteWalletApi(id, token)`, namun fungsi ini belum di-import dari `../services/api.js`. Jika dipanggil, memicu `ReferenceError: deleteWalletApi is not defined`.
3. **Circular Infinite Re-render Loop pada `initAuth`**:
   - Fungsi `logout` menyertakan `hasInitializedAuth.current = false`.
   - Saat aplikasi pertama dibuka dan pengguna belum memiliki cookie sesi login, `initAuth` mendeteksi refresh gagal lalu memanggil `logout()`.
   - Pemanggilan `logout()` mereset `hasInitializedAuth.current` kembali ke `false` dan mengubah state React.
   - Re-render berikutnya memicu `initAuth` berjalan lagi, gagal lagi, memanggil `logout()`, dan berulang tanpa henti hingga memicu error React `Maximum update depth exceeded` yang membuat layar terkunci (freeze).
4. **CORS Rejection saat Port Vite Berubah**:
   - Konfigurasi `allowedOrigins` di [`backend/server.js`](file:///d:/month-4/project-keuwangan/backend/server.js) sebelumnya hanya mencantumkan port spesifik `5173`.
   - Saat port 5173 terpakai oleh proses yatim (orphan process), Vite secara otomatis berpindah ke `5174`. Hal ini menyebabkan seluruh request browser ditolak oleh middleware CORS backend dengan status `403 Forbidden`, sehingga refresh token dan pengambilan data awal gagal total.
5. **Proses Yatim (Orphan Node Process) Mengunci Port 5173**:
   - Terdapat proses latar belakang lama (PID 19588) yang masih memegang binding socket port 5173.

### Solusi yang Diterapkan:
- Mendeklarasikan `const logout = useCallback(...)` **sebelum** seluruh hook `useEffect` yang mereferensikannya.
- Mengimpor `deleteWalletApi` secara eksplisit dari `../services/api.js`.
- Menghapus mutasi `hasInitializedAuth.current = false` di dalam `logout`, serta menangani kegagalan refresh awal pada `initAuth` secara tenang (`setToken(null)`, `setUser(null)`) tanpa memicu efek samping loop.
- Memperluas matcher CORS di `backend/server.js` dengan regex `^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$` agar seluruh port development lokal diizinkan dengan aman bersama kredensial cookie.
- Mematikan proses yatim PID 19588 dan mengikat Vite kembali ke port bersih `http://localhost:5173`.

---

## 2. Ringkasan Fitur Tahap 7 (Dashboard & Analitik Keuangan)

Tahap 7 mengimplementasikan dashboard keuangan eksekutif modern, cerdas, dan responsif dengan integrasi penuh ke database backend:

1. **5 Kartu Ringkasan (Top KPI Cards)**:
   - **Total Saldo Seluruh Dompet**: Menghitung likuiditas riil bersih *lifetime* dari seluruh dompet aktif pengguna (`initialBalance` + seluruh mutasi pemasukan - pengeluaran tanpa double counting).
   - **Total Pemasukan (Periode Terpilih)**: Total akumulasi dana masuk pada periode waktu aktif disertai kuantitas transaksi.
   - **Total Pengeluaran (Periode Terpilih)**: Total akumulasi beban keluar pada periode waktu aktif disertai kuantitas transaksi.
   - **Selisih Pemasukan & Pengeluaran (Arus Kas Bersih / Net Cashflow)**: Selisih nominal surplus/defisit serta persentase *Savings Rate* dengan indikator warna dinamis.
   - **Sisa Anggaran & Peringatan Terlampaui**: Menghitung sisa plafon anggaran belanja dan mendeteksi kategori yang melebihi batas dengan lencana peringatan interaktif (`⚠️ X Anggaran Terlampaui` vs `✅ Anggaran Aman`).

2. **Filter Periode Waktu Fleksibel**:
   - **Bulan Ini (`this_month`)**: Rentang otomatis dari tanggal 1 s/d hari terakhir bulan berjalan.
   - **Bulan Sebelumnya (`last_month`)**: Rentang otomatis dari tanggal 1 s/d hari terakhir bulan lalu.
   - **3 Bulan Terakhir (`last_3_months`)**: Rentang dari 2 bulan lalu s/d akhir bulan berjalan.
   - **Rentang Khusus (`custom`)**: Pemilih tanggal kustom (`startDate` dan `endDate`) dengan validasi format ISO dan pencegahan tanggal terbalik (`startDate > endDate`).
   - Lencana visual menampilkan teks rentang tanggal aktif dan tombol refresh analitik real-time.

3. **Grafik Visual Interaktif (Recharts)**:
   - **Grafik Tren Arus Kas**: Area chart interaktif yang dapat di-toggle antara tampilan **Bulanan (6 Bulan Terakhir)** dan **Harian (Periode Terpilih)** dengan gradien warna modern dan tooltip komparasi.
   - **Grafik Komposisi Pengeluaran (Donut Chart)**: Diagram donat alokasi beban per kategori dengan label total pengeluaran di bagian tengah dan lencana persentase akurat.

4. **Panel Analisis Kategori Pengeluaran Terbesar**:
   - Daftar berperingkat kategori pengeluaran tertinggi dengan ikon, warna khusus, dan bilah progres persentase.
   - Penanda eksplisit jika suatu kategori telah melampaui limit anggaran bulanan yang ditentukan.
   - Penanganan *empty state* yang ramah jika belum ada pengeluaran pada periode terpilih.

5. **Integritas Data, Anti-Mock, & Multi-Tenant Isolation**:
   - Seluruh data bersumber murni dari REST API backend dan database SQLite/Prisma.
   - Endpoint analitik `/api/analytics/summary` strictly memfilter `userId: req.user.id`. Data pengguna lain (User B) terisolasi 100% dan tidak pernah mencemari kalkulasi pengguna aktif (User A).

---

## 3. Berkas yang Dibuat dan Diubah

### Berkas Baru
| Path Berkas | Deskripsi |
|---|---|
| [`backend/src/controllers/analyticsController.js`](file:///d:/month-4/project-keuwangan/backend/src/controllers/analyticsController.js) | Controller backend untuk agregasi ringkasan saldo, pemasukan, pengeluaran, analisis anggaran, kategori, tren bulanan & harian. |
| [`backend/src/routes/analyticsRoutes.js`](file:///d:/month-4/project-keuwangan/backend/src/routes/analyticsRoutes.js) | Router Express yang memetakan rute `/api/analytics/*` di bawah proteksi `requireAuth`. |
| [`backend/test-tahap7.js`](file:///d:/month-4/project-keuwangan/backend/test-tahap7.js) | Test suite otomatis Tahap 7 menguji 55 assertion mencakup agregasi, filter periode, tanggal kustom, empty data, dan isolasi multi-tenant. |

### Berkas yang Diubah
| Path Berkas | Perubahan yang Dilakukan |
|---|---|
| [`backend/server.js`](file:///d:/month-4/project-keuwangan/backend/server.js) | Mendaftarkan `analyticsRoutes` pada `/api/analytics` dan memperluas allowed origins CORS untuk seluruh port dev lokal. |
| [`backend/src/middlewares/authMiddleware.js`](file:///d:/month-4/project-keuwangan/backend/src/middlewares/authMiddleware.js) | Menambahkan alias `export const authenticateToken = requireAuth` untuk kompatibilitas import. |
| [`fintrack/src/services/api.js`](file:///d:/month-4/project-keuwangan/fintrack/src/services/api.js) | Menambahkan fungsi klien `getAnalyticsSummaryApi(params, token)`. |
| [`fintrack/src/context/FinanceContext.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/context/FinanceContext.jsx) | Memperbaiki TDZ ReferenceError, menambahkan `deleteWalletApi`, menghapus circular auth loop, serta mengintegrasikan filter periode dan metrik analitik. |
| [`fintrack/src/pages/Dashboard.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/pages/Dashboard.jsx) | Mengimplementasikan filter periode toolbar, 5 kartu ringkasan KPI, analisis kategori dengan bilah progres, dan integrasi data real-time. |
| [`fintrack/src/components/CashflowChart.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/components/CashflowChart.jsx) | Menambahkan toggle mode tampilan Bulanan vs Harian, tooltip Rupiah komprehensif, dan empty state. |
| [`fintrack/src/components/ExpensePieChart.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/components/ExpensePieChart.jsx) | Menambahkan label nominal total di bagian tengah donat, lencana persentase, dan deteksi peringatan anggaran terlampaui. |
| [`fintrack/src/index.css`](file:///d:/month-4/project-keuwangan/fintrack/src/index.css) | Menambahkan styling kartu anggaran `.stat-card.card-budget`, bilah filter, dan grid responsif. |

---

## 4. Spesifikasi Endpoint REST API Baru (`/api/analytics`)

Endpoint ini mewajibkan Bearer Token pengguna terautentikasi:
`Authorization: Bearer <access_token>`

### `GET /api/analytics/summary`
Mengambil ringkasan analitik komprehensif, metrik periode, rincian kategori, dan tren grafik.

**Query Parameters (Opsional)**:
- `period`: `this_month` (default) | `last_month` | `last_3_months` | `custom` | `all`
- `startDate`: Format `YYYY-MM-DD` (wajib diisi jika `period=custom`)
- `endDate`: Format `YYYY-MM-DD` (wajib diisi jika `period=custom`)

**Contoh Response Sukses (Status 200 OK)**:
```json
{
  "success": true,
  "data": {
    "period": {
      "type": "this_month",
      "startDate": "2026-10-01",
      "endDate": "2026-10-31"
    },
    "summary": {
      "totalBalance": 36500000,
      "totalIncome": 18000000,
      "totalExpense": 3000000,
      "netCashflow": 15000000,
      "savingsRate": 83,
      "totalBudget": 2000000,
      "totalBudgetSpent": 2100000,
      "remainingBudget": 0,
      "exceededBudgetCount": 1,
      "exceededBudgetAmount": 300000,
      "transactionCount": 5
    },
    "categoryBreakdown": [
      {
        "categoryId": "food",
        "name": "Makanan & Minuman",
        "color": "#ef4444",
        "icon": "Utensils",
        "spent": 1800000,
        "percentage": 60.0,
        "budget": 1500000,
        "isExceeded": true
      },
      {
        "categoryId": "entertainment",
        "name": "Hiburan",
        "color": "#8b5cf6",
        "icon": "Film",
        "spent": 900000,
        "percentage": 30.0,
        "budget": 0,
        "isExceeded": false
      },
      {
        "categoryId": "transport",
        "name": "Transportasi",
        "color": "#f59e0b",
        "icon": "Car",
        "spent": 300000,
        "percentage": 10.0,
        "budget": 500000,
        "isExceeded": false
      }
    ],
    "monthlyTrend": [
      { "key": "2026-05", "month": "Mei 2026", "income": 0, "expense": 0, "net": 0 },
      { "key": "2026-06", "month": "Jun 2026", "income": 0, "expense": 0, "net": 0 },
      { "key": "2026-07", "month": "Jul 2026", "income": 0, "expense": 0, "net": 0 },
      { "key": "2026-08", "month": "Agu 2026", "income": 0, "expense": 0, "net": 0 },
      { "key": "2026-09", "month": "Sep 2026", "income": 12000000, "expense": 1000000, "net": 11000000 },
      { "key": "2026-10", "month": "Okt 2026", "income": 18000000, "expense": 3000000, "net": 15000000 }
    ],
    "dailyTrend": [
      { "date": "2026-10-10", "formattedDate": "10 Okt", "income": 18000000, "expense": 0, "net": 18000000 },
      { "date": "2026-10-15", "formattedDate": "15 Okt", "income": 0, "expense": 3000000, "net": -3000000 }
    ],
    "wallets": [
      { "id": "w-1", "name": "BCA Utama", "type": "Bank", "color": "#6366f1", "balance": 33300000 },
      { "id": "w-2", "name": "Dompet Tunai", "type": "Cash", "color": "#10b981", "balance": 3200000 }
    ],
    "budgetAnalysis": [
      {
        "budgetId": "b-1",
        "categoryId": "food",
        "categoryName": "Makanan & Minuman",
        "limit": 1500000,
        "spent": 1800000,
        "remaining": 0,
        "isExceeded": true,
        "exceededBy": 300000,
        "percentage": 100
      }
    ]
  }
}
```

---

## 5. Ringkasan Pengujian dan Verifikasi Build

### 1. Eksekusi Test Suite Tahap 7 (`test-tahap7.js`)
```bash
node test-tahap7.js
```
Hasil: **55 dari 55 assertion LULUS (100%)**.  
Mencakup:
- Proteksi token autentikasi (401 pada request tanpa token atau token rusak).
- Penanganan data kosong bagi pengguna baru (zero transactions tanpa runtime crash).
- Agregasi matematis saldo dompet, pemasukan, pengeluaran, net cashflow, dan savings rate.
- Filter periode waktu (`this_month`, `last_month`, `last_3_months`, `custom`).
- Validasi format tanggal ISO dan penolakan `startDate > endDate` (400 Bad Request).
- Pendeteksian kuantitas & nominal anggaran yang terlampaui.
- Akurasi persentase beban kategori dan pengurutan kategori terbesar.
- Isolasi data antar akun (User A vs User B).

### 2. Matriks Pengujian Regresi Keseluruhan
| Test Suite | Lingkup Pengujian | Status | Skor |
|---|---|---|---|
| `test-tahap7.js` | Dashboard & Analitik Keuangan, Agregasi, Filter, Empty Data, Isolasi | **PASS** | 55 Lulus, 0 Gagal |
| `test-tahap6.js` | Ekspor CSV, Formula Injection Mitigation, Cadangan JSON, Atomic Import | **PASS** | 53 Lulus, 0 Gagal |
| `test-tahap5.js` | HttpOnly Cookie, Rotasi Refresh Token, CSRF, Reuse Detection | **PASS** | 36 Lulus, 0 Gagal |
| `test-tahap4.js` | Kategori Dinamis, Paginasi Transaksi, Multi-filter DB | **PASS** | 45 Lulus, 0 Gagal |
| `test-wallets-budgets.js` | CRUD Dompet, Limit Anggaran, Proteksi Relasi Transaksi | **PASS** | 32 Lulus, 0 Gagal |
| `test-auth.js` | Multi-tenant Auth, Hashing Bcrypt, Isolasi Kepemilikan Data | **PASS** | 27 Lulus, 0 Gagal |
| `test-api.js` | Health Check, CRUD Mutasi Transaksi Dasar | **PASS** | 20 Lulus, 0 Gagal |
| **TOTAL** | **Seluruh Rangkaian Uji Otomatis FinTrack** | **100% PASS** | **268 Lulus, 0 Gagal** |

### 3. Kompilasi & Build Frontend
```bash
cd fintrack && npm.cmd run build
```
Hasil:
```text
vite v8.3.2 building client environment for production...
transforming...
✓ 2475 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.22 kB │ gzip:   0.67 kB
dist/assets/index-CxtU-qQg.css   30.01 kB │ gzip:   5.74 kB
dist/assets/index-BgG3gR7l.js   732.51 kB │ gzip: 210.59 kB
✓ built in 1.37s
```

---

## 6. Panduan Langkah Verifikasi Manual di Browser

1. **Jalankan Backend dan Frontend**:
   - Backend: Jalankan `node server.js` di direktori `backend` (port 3000).
   - Frontend: Jalankan `npm run dev` di direktori `fintrack` (port 5173).
2. **Akses Aplikasi**:
   - Buka browser (Chrome, Edge, atau Firefox) dan arahkan ke `http://localhost:5173`.
   - Jika belum login, form masuk modern FinTrack akan tampil. Klik **Masuk Cepat dengan Akun Demo** atau buat akun baru.
3. **Uji Filter Periode**:
   - Pada toolbar atas Dashboard, klik tombol **Bulan Ini**, **Bulan Sebelumnya**, dan **3 Bulan Terakhir**.
   - Perhatikan bahwa kelima kartu KPI, grafik arus kas, dan diagram donat seketika berubah mengikuti periode waktu yang dipilih.
   - Pilih **Rentang Khusus**, lalu masukkan tanggal awal dan tanggal akhir. Metrik akan terhitung akurat sesuai rentang tersebut.
4. **Uji 5 Kartu Ringkasan (KPI)**:
   - Verifikasi kartu **Total Saldo Bersih** menampilkan total saldo dari semua dompet/rekening.
   - Verifikasi kartu **Total Pemasukan** dan **Total Pengeluaran** menampilkan nominal dalam format Rupiah (`Rp ...`).
   - Verifikasi kartu **Selisih Arus Kas (Net)** dan rasio tabungan.
   - Verifikasi kartu **Sisa Plafon Anggaran** menampilkan status apakah ada anggaran yang terlampaui.
5. **Uji Grafik Arus Kas**:
   - Klik tombol **Bulanan** untuk melihat tren perbandingan 6 bulan.
   - Klik tombol **Harian** untuk melihat riwayat arus dana harian pada periode yang sedang difilter.
   - Arahkan kursor (*hover*) ke area grafik untuk melihat rincian angka pada tooltip Rupiah.
6. **Uji Analisis Kategori**:
   - Periksa panel **Analisis Kategori Pengeluaran Terbesar**.
   - Amati bilah progres persentase dan lencana peringatan merah jika pengeluaran melebihi limit anggaran.
7. **Periksa Console Browser**:
   - Buka DevTools (`F12` -> tab **Console** dan **Network**).
   - Pastikan tidak ada unhandled runtime errors, tidak ada error CORS, dan request ke `/api/analytics/summary` mengembalikan status `200 OK`.

---

## 7. Risiko yang Masih Tersisa

1. **Agregasi Volume Data Sangat Besar (High-Volume Big Data)**:
   - Agregasi saat ini diproses secara instan di level SQLite / Node.js runtime. Jika satu akun pengguna memiliki lebih dari 100.000 transaksi mutasi, disarankan menambahkan index komposit database `@@index([userId, date])` dan caching level Redis untuk kalkulasi bulanan.
2. **Penyesuaian Jam Transaksi pada Zona Waktu Pengguna (Timezone Offset)**:
   - Format tanggal saat ini dipatok berdasarkan hari kalender lokal pengguna (`YYYY-MM-DD`). Transaksi yang dicatat di batas pergantian tengah malam (misal pukul 23:59 WIB) menggunakan filter UTC+0 pada server mungkin memiliki pergeseran beberapa jam jika server di-deploy di cloud dengan zona waktu UTC murni. Disarankan menyertakan header `X-Timezone` di masa depan jika dideploy ke multi-region.
