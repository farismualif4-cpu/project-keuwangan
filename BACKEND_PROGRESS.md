# FinTrack — Backend Progress Report: Tahap 4 (Kategori Dinamis, Filter Transaksi, dan Paginasi)

*Tanggal Pelaksanaan*: 11 Oktober 2026  
*Status Pengerjaan*: **Selesai dan Diuji Penuh**  
*Hasil Pengujian*:
- **Test Suite Tahap 4 (`test-tahap4.js`)**: 45 dari 45 assertion LULUS (100%)
- **Regresi Dompet & Anggaran (`test-wallets-budgets.js`)**: 32 dari 32 assertion LULUS (100%)
- **Regresi Autentikasi & Keamanan Data (`test-auth.js`)**: 27 dari 27 assertion LULUS (100%)
- **Regresi API Transaksi Dasar (`test-api.js`)**: 20 dari 20 assertion LULUS (100%)
- **Total Pengujian Otomatis**: **124 assertion LULUS (0 Gagal)**
- **Persistensi Data Setelah Server Restart**: Teruji dan Terverifikasi
- **Build Frontend (`npm.cmd run build`)**: Berhasil tanpa error (`built in 728ms`)

---

## 1. Ringkasan Perubahan Tahap 4

Pada **Tahap 4**, fokus pengembangan mencakup penambahan kategori dinamis ke dalam database, filter transaksi canggih, paginasi di tingkat database, integrasi antarmuka frontend, serta audit komprehensif rencana migrasi autentikasi ke cookie `HttpOnly`.

Poin-poin perubahan yang telah diimplementasikan:
1. **Model Database Kategori Dinamis (`Category`)**:
   - Skema Prisma diperluas dengan model `Category` yang memiliki atribut: `id`, `name`, `type` (`income` | `expense`), `color`, `icon`, `isSystem` (Boolean), `userId`, `createdAt`, dan `updatedAt`.
   - Menggunakan indeks unik majemuk `@@unique([userId, name, type])` untuk mencegah duplikasi nama kategori dengan tipe yang sama bagi pengguna yang sama.
   - Merancang relasi opsional dengan `User` sehingga kategori sistem dapat berdiri secara global (`userId: null`), sedangkan kategori kustom terikat erat dengan pemilik akun (`userId: user.id`).
2. **Penyemaian (*Seeding*) Kategori Sistem Bawaan**:
   - Dibuat modul [`backend/src/config/seedCategories.js`](file:///d:/month-4/project-keuwangan/backend/src/config/seedCategories.js) yang mengeksekusi 13 kategori sistem bawaan (8 pengeluaran dan 5 pemasukan) menggunakan ID kanonik yang konsisten (`food`, `transport`, `shopping`, `bills`, `entertainment`, `health`, `education`, `others_exp`, `salary`, `freelance`, `investment`, `bonus`, `others_inc`).
   - Pendekatan ID kanonik ini menjamin **100% kompatibilitas mundur** dengan transaksi dan anggaran lama tanpa risiko *foreign key mismatch* atau data rusak.
3. **Endpoint REST API Kategori (`/api/categories`)**:
   - `GET /api/categories`: Mengambil kategori sistem ditambah kategori kustom milik pengguna yang sedang login (`OR: [{ isSystem: true }, { userId: req.user.id }]`). Mendukung query filter `?type=income` atau `?type=expense`.
   - `GET /api/categories/:id`: Mengambil detail satu kategori milik pengguna atau kategori sistem.
   - `POST /api/categories`: Membuat kategori kustom baru dengan validasi ketat (nama minimal 2 karakter, tipe wajib `income` atau `expense`).
   - `PUT /api/categories/:id`: Memperbarui kategori kustom milik pengguna. Permintaan edit kategori sistem ditolak dengan HTTP 403 Forbidden.
   - `DELETE /api/categories/:id`: Menghapus kategori kustom milik pengguna. Permintaan hapus kategori sistem ditolak dengan HTTP 403 Forbidden. Menghapus kategori yang masih digunakan oleh transaksi atau alokasi anggaran ditolak aman dengan HTTP 400 Bad Request.
4. **Filter Transaksi dan Paginasi di Tingkat Database (`/api/transactions`)**:
   - Endpoint `GET /api/transactions` diperluas dengan query parameters:
     - `page`: Nomor halaman (angka bulat positif, minimal 1).
     - `limit`: Jumlah data per halaman (angka bulat positif, otomatis dibatasi maksimal 100 untuk mencegah *denial of service* query).
     - `type`: Filter tipe (`income` atau `expense`).
     - `category`: Filter kategori ID.
     - `wallet`: Filter dompet ID.
     - `startDate` & `endDate`: Filter rentang tanggal transaksi dengan batas waktu penuh (00:00:00.000 hingga 23:59:59.999). Dilengkapi validasi format dan validasi logika rentang (`startDate > endDate` ditolak dengan HTTP 400).
     - `search`: Pencarian teks pada judul atau catatan transaksi (*case-insensitive*).
   - Pengurutan default konsisten: Tanggal terbaru terlebih dahulu (`date: 'desc'`), kemudian `createdAt: 'desc'`.
   - Respons API mengembalikan metadata paginasi terstruktur: `{ page, limit, total, totalPages }` dengan tetap menjaga *field* `data` berupa array transaksi guna mempertahankan kompatibilitas kontrak API lama.
5. **Validasi Kategori pada Mutasi Transaksi**:
   - Pada saat membuat (`POST`) atau memperbarui (`PUT`) transaksi, ID kategori divalidasi ke database. Jika kategori tidak ditemukan atau milik pengguna lain, sistem menolak dengan HTTP 400 Bad Request.
6. **Integrasi Antarmuka Frontend (`fintrack`)**:
   - [`fintrack/src/services/api.js`](file:///d:/month-4/project-keuwangan/fintrack/src/services/api.js): Ditambahkan fungsi `getCategoriesApi`, `getCategoryByIdApi`, `createCategoryApi`, `updateCategoryApi`, `deleteCategoryApi`, dan diperluas `getTransactionsApi` untuk menyertakan seluruh parameter filter dan paginasi.
   - [`fintrack/src/context/FinanceContext.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/context/FinanceContext.jsx): Menyediakan state kategori dinamis dari database, fungsi mutasi kategori (`addCategory`, `updateCategory`, `deleteCategory`), pemanggilan query transaksi berfilter via `fetchFilteredTransactions`, serta pembaruan perhitungan metrik finansial agar **seluruh transaksi pengguna tetap dihitung secara utuh** dan tidak terpotong oleh halaman paginasi aktif.
   - [`fintrack/src/pages/TransactionsPage.jsx`](file:///d:/month-4/project-keuwangan/fintrack/src/pages/TransactionsPage.jsx): Dilengkapi bilah filter canggih (pencarian, tombol tipe transaksi, filter dropdown kategori & dompet, pemilih rentang tanggal, tombol reset filter), modal Kelola Kategori Dinamis, serta navigasi paginasi (Sebelumnya, Nomor Halaman Aktif, Berikutnya, dan pengatur limit per halaman).
   - [`fintrack/src/index.css`](file:///d:/month-4/project-keuwangan/fintrack/src/index.css): Ditambahkan styling profesional untuk kontrol filter canggih, navigasi paginasi, tombol halaman aktif, serta modal kelola kategori.

---

## 2. Struktur Folder Terkini

```text
project-keuwangan/
├── BACKEND_PROGRESS.md                  # Laporan progres root proyek (File ini)
├── FINTRACK_AUDIT.md                    # Laporan audit arsitektur menyeluruh
├── backend/                             # Backend Node.js + Express + Prisma + SQLite
│   ├── .env                             # Konfigurasi lokal aktif (PORT, DB, JWT_SECRET, JWT_EXPIRES_IN)
│   ├── .env.example                     # Contoh template konfigurasi environment
│   ├── .gitignore                       # Menolak node_modules, .env, *.db, *.db.backup*
│   ├── package.json                     # Dependensi: express, cors, dotenv, @prisma/client, bcryptjs, jsonwebtoken
│   ├── server.js                        # Server Express dengan seeder kategori sistem otomatis
│   ├── test-api.js                      # Skrip uji regresi CRUD transaksi dasar (20 assertions)
│   ├── test-auth.js                     # Skrip uji regresi autentikasi & isolasi multi-tenant (27 assertions)
│   ├── test-wallets-budgets.js          # Skrip uji regresi dompet & anggaran (32 assertions)
│   ├── test-tahap4.js                   # Skrip uji komprehensif Tahap 4 (45 assertions)
│   ├── prisma/
│   │   ├── dev.db                       # Database SQLite aktif (14 users, 16 transactions, 4 wallets, 4 budgets, 13 categories)
│   │   ├── dev.db.backup_tahap3         # Cadangan fisik database Tahap 3
│   │   ├── dev.db.backup_tahap4         # Cadangan fisik database sebelum migrasi Tahap 4
│   │   ├── schema.prisma                # Skema data model User, Transaction, Wallet, Budget, Category
│   │   └── migrations/
│   │       ├── 20261010184431_init/
│   │       ├── 20261010185950_add_user_model/
│   │       └── 20261010192145_add_wallets_and_budgets/
│   │       └── 20261010194023_add_categories_model/ # Migrasi DDL tabel categories & relasi User
│   └── src/
│       ├── config/
│       │   ├── prisma.js                # Singleton PrismaClient instance
│       │   └── seedCategories.js        # Logika seeder 13 kategori sistem bawaan
│       ├── controllers/
│       │   ├── authController.js        # Controller auth dengan fail-safe secret check
│       │   ├── transactionController.js # CRUD transaksi dengan filter database, paginasi & validasi kategori
│       │   ├── walletController.js      # CRUD dompet dengan kalkulasi saldo mutasi
│       │   ├── budgetController.js      # CRUD anggaran dengan spent tracker per kategori
│       │   └── categoryController.js    # CRUD kategori dinamis dengan proteksi sistem & referensi data
│       ├── middlewares/
│       │   ├── authMiddleware.js        # JWT Bearer authentication guard
│       │   └── errorHandler.js          # Global error & 404 handler
│       └── routes/
│           ├── authRoutes.js            # /api/auth rute
│           ├── healthRoutes.js          # /api/health rute
│           ├── transactionRoutes.js     # /api/transactions rute (Protected)
│           ├── walletRoutes.js          # /api/wallets rute (Protected)
│           ├── budgetRoutes.js          # /api/budgets rute (Protected)
│           └── categoryRoutes.js        # /api/categories rute (Protected)
└── fintrack/                            # Frontend React 19 + Vite
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx                      # Root application dengan Auth Guard
        ├── main.jsx                     # Entry point Vite React
        ├── context/
        │   └── FinanceContext.jsx       # State Auth, Transaksi, Dompet, Anggaran, dan Kategori Dinamis
        ├── services/
        │   └── api.js                   # Client REST API FinTrack
        ├── pages/
        │   ├── AuthPage.jsx             # Halaman Login & Registrasi
        │   ├── Dashboard.jsx            # KPI finansial & ringkasan dompet
        │   ├── TransactionsPage.jsx     # Bilah filter canggih, paginasi, dan kelola kategori
        │   ├── ReportsPage.jsx          # Evaluasi arus kas & aturan 50/30/20
        │   ├── BudgetPage.jsx           # Alokasi batas anggaran kategori tersinkronkan ke DB
        │   └── SettingsPage.jsx         # Pengaturan akun
        └── index.css                    # Design token dan styling komponen
```

---

## 3. Perubahan Schema Database & Migrasi Prisma

### Cadangan Database Sebelum Migrasi
Sebelum melakukan migrasi skema, database disalin secara fisik ke:
`backend/prisma/dev.db.backup_tahap4`  
Hasil verifikasi integritas: Seluruh 14 akun pengguna, 16 transaksi, 4 dompet, dan 4 anggaran tersimpan utuh tanpa kehilangan atau perubahan data (*0 data loss*).

### Definisi Skema Prisma (`schema.prisma`)
```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
  wallets      Wallet[]
  budgets      Budget[]
  categories   Category[]    // Relasi ke kategori kustom

  @@map("users")
}

model Category {
  id        String   @id @default(uuid())
  name      String
  type      String   // "income" atau "expense"
  color     String?  // Kode warna HEX (opsional)
  icon      String?  // Nama icon Lucide (opsional)
  isSystem  Boolean  @default(false) // True jika kategori bawaan sistem
  userId    String?  // Null jika kategori sistem, terisi jika kategori kustom
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name, type])
  @@map("categories")
}
```

### Eksekusi Migrasi
Migrasi dijalankan menggunakan:
```bash
npx prisma migrate dev --name add_categories_model
```
Dihasilkan direktori migrasi:
`backend/prisma/migrations/20261010194023_add_categories_model/migration.sql`

---

## 4. Dokumentasi Kontrak REST API Tahap 4

### A. Endpoint Kategori (`/api/categories`)
Semua endpoint kategori wajib menyertakan header:
`Authorization: Bearer <jwt_token>`

| Method | Endpoint | Query / Body Params | Deskripsi & Proteksi | Status Sukses |
|---|---|---|---|---|
| `GET` | `/api/categories` | `?type=income` atau `?type=expense` | Mengambil seluruh kategori sistem ditambah kategori kustom milik pengguna aktif. | 200 OK |
| `GET` | `/api/categories/:id` | - | Mengambil detail 1 kategori berdasarkan ID. Jika ID milik pengguna lain, menghasilkan 404 Not Found. | 200 OK |
| `POST` | `/api/categories` | `{ name, type, color, icon }` | Membuat kategori kustom baru. Validasi: `name` minimal 2 karakter, `type` wajib `income` atau `expense`. Duplikasi nama ditolak (400). | 201 Created |
| `PUT` | `/api/categories/:id` | `{ name, type, color, icon }` | Mengubah kategori kustom. Mengubah kategori sistem ditolak dengan 403 Forbidden. Mengubah milik user lain menghasilkan 404. | 200 OK |
| `DELETE` | `/api/categories/:id` | - | Menghapus kategori kustom. Menghapus kategori sistem ditolak (403 Forbidden). Menghapus kategori yang digunakan transaksi/anggaran ditolak (400 Bad Request). | 200 OK |

### B. Endpoint Transaksi yang Diperluas (`/api/transactions`)
Query parameter yang didukung:
- `page` (default: 1): Nomor halaman yang diminta.
- `limit` (default: 10, max: 100): Jumlah data per halaman.
- `type`: `income` atau `expense`.
- `category`: ID kategori.
- `wallet`: ID dompet.
- `startDate` & `endDate`: Rentang tanggal (format `YYYY-MM-DD`).
- `search`: Kata kunci pencarian judul atau deskripsi.

Contoh Respons:
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar transaksi pengguna",
  "count": 3,
  "pagination": {
    "page": 1,
    "limit": 3,
    "total": 8,
    "totalPages": 3
  },
  "data": [
    {
      "id": "0b831d40-a488-481b-a24d-e5135df518ce",
      "title": "Tagihan Listrik PLN",
      "amount": 450000,
      "type": "expense",
      "category": "bills",
      "wallet": "bank",
      "date": "2026-10-10",
      "createdAt": "2026-10-10T19:51:06.000Z"
    }
  ]
}
```

---

## 5. Hasil Pengujian Aktual

Seluruh pengujian dijalankan langsung terhadap server lokal aktif pada port 3000.

### 1. Test Suite Tahap 4 (`backend/test-tahap4.js`)
Perintah eksekusi:
```powershell
node backend/test-tahap4.js
```
Hasil Aktual:
```text
====================================================
🧪 FINTRACK TAHAP 4 TEST SUITE: CATEGORIES & FILTER
====================================================

[TEST GROUP 0] Memeriksa Health Server
  ✅ PASS: GET /api/health mengembalikan 200 OK

[TEST GROUP 1] Registrasi User A dan User B
  ✅ PASS: User A berhasil registrasi dan mendapat token
  ✅ PASS: User B berhasil registrasi dan mendapat token

[TEST GROUP 2] Kategori Sistem & Akses Auth
  ✅ PASS: GET /api/categories tanpa token ditolak (401 Unauthorized)
  ✅ PASS: User A dapat mengambil daftar kategori (200 OK)
  ✅ PASS: Mengembalikan setidaknya 13 kategori sistem (ditemukan: 13)
  ✅ PASS: Kategori sistem "food" ditemukan dengan isSystem=true
  ✅ PASS: Query ?type=expense hanya mengembalikan kategori expense

[TEST GROUP 3] Perlindungan Kategori Sistem
  ✅ PASS: PUT /api/categories/food ditolak dengan 403 Forbidden
  ✅ PASS: DELETE /api/categories/food ditolak dengan 403 Forbidden

[TEST GROUP 4] Pembuatan & Validasi Kategori Kustom
  ✅ PASS: Nama kategori < 2 karakter ditolak (400 Bad Request)
  ✅ PASS: Tipe kategori selain income/expense ditolak (400 Bad Request)
  ✅ PASS: User A berhasil membuat kategori kustom "Langganan AI" (201 Created)
  ✅ PASS: User A berhasil membuat kategori kustom Income "Dividen Saham"
  ✅ PASS: Kategori kustom duplikat untuk user yang sama ditolak (400 Bad Request)

[TEST GROUP 5] Isolasi Multi-Tenant Kategori
  ✅ PASS: User B tidak dapat mengakses kategori User A via ID (404 Not Found)
  ✅ PASS: User B tidak dapat mengubah kategori User A (404 Not Found)
  ✅ PASS: User B tidak dapat menghapus kategori User A (404 Not Found)
  ✅ PASS: Daftar kategori User B tidak memuat kategori kustom User A

[TEST GROUP 6] Integrasi Kategori pada Transaksi & Proteksi Hapus
  ✅ PASS: Transaksi dengan ID kategori fiktif ditolak (400 Bad Request)
  ✅ PASS: Transaksi dengan kategori kustom berhasil dibuat
  ✅ PASS: Penghapusan kategori yang masih digunakan transaksi ditolak (400 Bad Request)

[TEST GROUP 7] Filter Transaksi & Paginasi Database
  ✅ PASS: GET /api/transactions?type=income sukses (200 OK)
  ✅ PASS: Filter type=income menghasilkan tepat 2 transaksi pemasukan (ditemukan: 2)
  ✅ PASS: Filter category=food menghasilkan 2 transaksi (ditemukan: 2)
  ✅ PASS: Filter wallet=cash menghasilkan tepat 2 transaksi (ditemukan: 2)
  ✅ PASS: Filter search=makan mengembalikan 2 transaksi yang cocok (ditemukan: 2)
  ✅ PASS: Filter rentang tanggal 2026-10-03 s/d 2026-10-05 mengembalikan 3 transaksi (ditemukan: 3)
  ✅ PASS: Format startDate tidak valid ditolak (400 Bad Request)
  ✅ PASS: startDate > endDate ditolak (400 Bad Request)

[TEST GROUP 8] Pengujian Paginasi & Metadata
  ✅ PASS: GET transaksi paginasi mengembalikan 200 OK
  ✅ PASS: Halaman 1 dengan limit 3 mengembalikan 3 transaksi
  ✅ PASS: Metadata pagination.page === 1
  ✅ PASS: Metadata pagination.limit === 3
  ✅ PASS: Metadata pagination.total === 8 (ditemukan: 8)
  ✅ PASS: Metadata pagination.totalPages === 3 (ditemukan: 3)
  ✅ PASS: Halaman 2 dengan limit 3 mengembalikan 3 transaksi
  ✅ PASS: Data halaman 2 berbeda dengan halaman 1
  ✅ PASS: Halaman 3 mengembalikan sisa 2 transaksi
  ✅ PASS: Halaman di luar jangkauan mengembalikan array kosong
  ✅ PASS: Query page < 1 ditolak (400 Bad Request)
  ✅ PASS: Limit melebihi batas dipatok aman ke maksimum 100

[TEST GROUP 9] Isolasi Transaksi Antar Pengguna
  ✅ PASS: User B tidak dapat melihat transaksi User A (total: 0)

[TEST GROUP 10] Pembaruan & Penghapusan Kategori Kustom
  ✅ PASS: User A berhasil mengubah kategori miliknya
  ✅ PASS: User A berhasil menghapus kategori kustom yang tidak dipakai

====================================================
📊 RINGKASAN HASIL TEST TAHAP 4:
   Total Lulus (PASS): 45
   Total Gagal (FAIL): 0
====================================================
```

### 2. Regresi Dompet & Anggaran (`backend/test-wallets-budgets.js`)
Perintah eksekusi:
```powershell
node backend/test-wallets-budgets.js
```
Hasil Aktual: **32 PASSED, 0 FAILED** (100% Lulus).

### 3. Regresi Autentikasi & Isolasi Data (`backend/test-auth.js`)
Perintah eksekusi:
```powershell
node backend/test-auth.js
```
Hasil Aktual: **27 PASSED, 0 FAILED** (100% Lulus).

### 4. Regresi CRUD Transaksi (`backend/test-api.js`)
Perintah eksekusi:
```powershell
node backend/test-api.js
```
Hasil Aktual: **20 PASSED, 0 FAILED** (100% Lulus).

### 5. Pengujian Persistensi Data Setelah Server Restart
- Proses server dihentikan menggunakan sinyal shutdown.
- Server dijalankan ulang (`node server.js`).
- Seluruh 45 assertion `test-tahap4.js` dijalankan ulang dan tetap lulus 100%, mengonfirmasi persistensi tabel `categories`, `transactions`, `wallets`, `budgets`, dan `users` di dalam file SQLite `dev.db`.

### 6. Hasil Build Frontend (`fintrack`)
Perintah eksekusi:
```powershell
npm.cmd run build
```
Hasil Aktual:
```text
> fintrack@0.0.0 build
> vite build

vite v8.3.2 building client environment for production...
transforming...
✓ 2475 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.22 kB │ gzip:   0.67 kB
dist/assets/index-C85NT1g8.css   27.40 kB │ gzip:   5.40 kB
dist/assets/index-BXah0lEI.js   700.85 kB │ gzip: 203.46 kB
✓ built in 728ms
```

---

## 6. Prioritas 4: Audit Keamanan Cookie & Rencana Migrasi Terpisah

> **Catatan Penting**: Sesuai instruksi wajib, mekanisme access token pada tahap ini **tidak diganti secara diam-diam**. Bagian ini merupakan audit teknis mendalam dan cetak biru (*blueprint*) migrasi arsitektur sesi ke cookie `HttpOnly` untuk Tahap 5.

### 1. Kondisi Saat Ini vs Ancaman Keamanan
- **Kondisi Aktual**:
  - Access token disimpan di `localStorage` pada browser (`fintrack_jwt_token_v1`) dan dikirimkan melalui header `Authorization: Bearer <token>`.
  - Token memiliki masa berlaku 7 hari (`JWT_EXPIRES_IN=7d`).
- **Ancaman & Keterbatasan**:
  - `localStorage` dapat diakses oleh skrip JavaScript apa pun yang dieksekusi di context origin aplikasi. Jika terdapat celah *Cross-Site Scripting* (XSS) melalui dependensi pihak ketiga atau injeksi HTML, token dapat dicuri oleh pihak luar.
  - Token yang dicuri memiliki masa hidup panjang (7 hari) tanpa mekanisme pembatalan (*revocation*) terpusat.

### 2. Desain Arsitektur Target (HttpOnly Cookie + CSRF Protection)

```
[ Frontend: React ]                                     [ Backend: Express ]
       |                                                         |
       | 1. POST /api/auth/login { email, password }             |
       |-------------------------------------------------------->|
       |                                                         | Validasi kredensial
       |                                                         | Buat Access Token (15 menit)
       |                                                         | Buat Refresh Token (7 hari)
       | 2. Set-Cookie: refreshToken (HttpOnly, Secure, SameSite)| Simpan Refresh Token di DB
       |    JSON: { accessToken, user }                          |
       |<--------------------------------------------------------|
       |                                                         |
       | 3. Simpan accessToken hanya di MEMORI (React State)     |
       |                                                         |
       | 4. GET /api/transactions (Header Authorization: Bearer) |
       |-------------------------------------------------------->| Verifikasi Access Token
       |                                                         |
       | --- Ketika Access Token Kedaluwarsa (HTTP 401) ---       |
       | 5. POST /api/auth/refresh (Cookie otomatis dikirim)     |
       |-------------------------------------------------------->| Verifikasi Refresh Token di DB
       | 6. JSON: { newAccessToken }                             | Rotasi Refresh Token baru
       |<--------------------------------------------------------|
```

### 3. Kebutuhan Perubahan Teknis pada Tahap 5

#### A. Backend Express & Database
1. **Model `RefreshToken` di Prisma**:
   ```prisma
   model RefreshToken {
     id        String   @id @default(uuid())
     tokenHash String   @unique
     userId    String
     revoked   Boolean  @default(false)
     expiresAt DateTime
     createdAt DateTime @default(now())
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   }
   ```
2. **Library Pendukung**:
   - `cookie-parser`: Mem-parsing cookie masuk dari request headers.
3. **Konfigurasi Cookie `res.cookie()`**:
   ```javascript
   res.cookie('refreshToken', refreshToken, {
     httpOnly: true,                                       // Tidak dapat dibaca oleh JavaScript (Anti-XSS)
     secure: process.env.NODE_ENV === 'production',        // Wajib HTTPS pada environment production
     sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Kebijakan pencegahan CSRF
     maxAge: 7 * 24 * 60 * 60 * 1000,                      // 7 hari
     path: '/api/auth'                                     // Batasi cookie hanya dikirim ke endpoint autentikasi
   });
   ```
4. **Endpoint Baru**:
   - `POST /api/auth/refresh`: Membaca cookie `refreshToken`, memverifikasi di database, menerbitkan access token baru di memori, serta merotasi refresh token (*Refresh Token Rotation*).
   - `POST /api/auth/logout`: Menandai refresh token sebagai `revoked` di database dan menghapus cookie via `res.clearCookie('refreshToken')`.

#### B. Konfigurasi CORS & Pertukaran Kredensial
- Express CORS wajib mengizinkan pertukaran kredensial:
  ```javascript
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true // Mengizinkan transmisi cookie antar-port/origin
  }));
  ```
  *Catatan penting*: Ketika `credentials: true`, nilai `origin` **tidak boleh berupa wildcard `*`**.

#### C. Perlindungan CSRF (Cross-Site Request Forgery)
- Karena cookie dikirim otomatis oleh browser pada request lintas domain, perlindungan terhadap CSRF menjadi wajib:
  - Kebijakan `SameSite: 'lax'` / `'strict'` memblokir pengiriman cookie pada request lintas situs (*cross-site POST*).
  - Untuk perlindungan berlapis, gunakan pola **Double Submit Cookie** atau custom header (misal `X-Requested-With: XMLHttpRequest` atau `X-CSRF-Token`), karena request lintas situs (*simple cross-origin request*) tidak dapat menambahkan custom header tanpa izin *preflight* CORS.

#### D. Frontend (`fintrack`)
- **Penyimpanan Token**:
  - Hapus penyimpanan access token dari `localStorage`.
  - Simpan access token murni di dalam memori React state (`FinanceContext`).
- **Fetch API Request**:
  - Semua panggilan `fetch()` ke endpoint auth wajib menyertakan:
    ```javascript
    fetch(url, {
      credentials: 'include', // Menginstruksikan browser menyertakan cookie
      ...
    });
    ```
- **Auto Silent Refresh (Token Expiry Handling)**:
  - Buat interceptor di `api.js`: Jika request mengembalikan HTTP 401 dan bukan dari endpoint login, panggil otomatis `refreshAccessTokenApi()`. Jika berhasil, ulangi (*retry*) request awal dengan token baru. Jika refresh token juga kedaluwarsa, arahkan pengguna ke halaman login.

#### E. Perbedaan Konfigurasi Environment Development vs Production
| Konfigurasi | Development | Production |
|---|---|---|
| Protokol | HTTP (`http://localhost:5173`) | HTTPS (`https://fintrack.app`) |
| `cookie.secure` | `false` (karena localhost HTTP) | `true` (wajib HTTPS, browser menolak cookie secure di plain HTTP) |
| `cookie.sameSite` | `'lax'` (mendukung port berbeda 5173 -> 3000) | `'strict'` atau `'lax'` |
| `CORS origin` | `http://localhost:5173` | `https://fintrack.app` |
| `JWT_SECRET` | Kunci dev yang aman di `.env` | Nilai secret acak dengan entropi tinggi via CI/CD secret manager |

---

## 7. Error yang Belum Selesai & Risiko yang Tersisa

1. **Penyimpanan Token Saat Ini Masih di LocalStorage**:
   - Access token saat ini masih disimpan di `localStorage` pada browser hingga migrasi Tahap 5 diterapkan. Risiko XSS masih ada jika terdapat skrip eksternal berbahaya yang dieksekusi di context klien.
2. **Konkurensi Database SQLite**:
   - SQLite bekerja sangat baik untuk kebutuhan personal single-user / multi-tenant beban ringan. Namun, jika skala pengguna bertambah tinggi dan banyak mutasi write terjadi bersamaan (*concurrent write locks*), proyek perlu mempertimbangkan migrasi ke PostgreSQL.
3. **Pengelolaan File Ekspor**:
   - Fitur ekspor transaksi ke CSV/PDF belum diimplementasikan di backend.

---

## 8. Rencana Tahap 5

1. **Implementasi Migrasi Autentikasi HttpOnly Cookie & Refresh Token Rotation**:
   - Terapkan tabel `RefreshToken` di Prisma.
   - Pindahkan token frontend dari `localStorage` ke in-memory state dengan silent refresh interceptor.
2. **Fitur Ekspor & Impor Data Finansial**:
   - Endpoint `GET /api/transactions/export?format=csv` dan `format=pdf`.
   - Fasilitas pencadangan data mandiri untuk pengguna.
3. **Visualisasi Analitik Lanjutan**:
   - Grafik tren multi-bulan interaktif dan perbandingan realisasi anggaran vs pengeluaran riil per kategori kustom.
