# 🚀 Panduan Deployment & Kesiapan Produksi (FinTrack)

Dokumen ini merupakan panduan resmi dan komprehensif untuk mempersiapkan, mengonfigurasi, dan men-deploy aplikasi **FinTrack** (*Personal Finance Management System*) ke lingkungan produksi dengan aman, andal, dan skalabel.

---

## 🏗️ 1. Arsitektur Aplikasi

FinTrack dibangun dengan arsitektur modern terpisah (*decoupled client-server architecture*):

```
+-------------------------------------------------------------+
|                KLIEN / BROWSER PENGGUNA                     |
|  - React 19 SPA (Vite Bundler + Rolldown Optimization)      |
|  - In-Memory Access Token Storage (Aman dari XSS)           |
|  - Double-Submit CSRF Header ('X-CSRF-Token')               |
+------------------------------+------------------------------+
                               |
                   HTTPS (TLS 1.3 Encrypted)
         CORS + Kredensial Cookie (HttpOnly, Secure)
                               |
                               v
+-------------------------------------------------------------+
|               BACKEND API (Node.js & Express)               |
|  - Endpoint RESTful (/api/auth, /api/transactions, dll)     |
|  - Middlewares: CORS, Rate Limiter, CSRF Verifier, Auth     |
|  - Rotasi Sesi Token Refresh (RFC 6749 BCP Reuse Detection) |
+------------------------------+------------------------------+
                               |
                          Prisma ORM
                               |
                               v
+-------------------------------------------------------------+
|                   DATABASE PERSISTEN                        |
|  - Lingkungan Lokal: SQLite (dev.db)                        |
|  - Lingkungan Cloud Produksi: SQLite dengan Persistent Disk |
|    atau PostgreSQL Terkelola (Supabase/Neon/Railway)        |
+-------------------------------------------------------------+
```

### Fitur Keamanan Bawaan:
1. **Penyimpanan Token Tanpa Risiko XSS**: *Access Token* hanya disimpan di memori JavaScript browser (`api.js`), tidak pernah disimpan di `localStorage` atau `sessionStorage`.
2. **HttpOnly Refresh Cookie**: Sesi refresh token dilindungi dengan flag `HttpOnly`, `SameSite`, dan `Secure` sehingga JavaScript berbahaya tidak dapat mencuri sesi.
3. **Double-Submit Cookie CSRF**: Melindungi endpoint mutasi (`POST`, `PUT`, `DELETE`) dari serangan pemalsuan permintaan antar situs.
4. **Isolasi Data Multi-Tenant**: Setiap operasi CRUD mewajibkan `userId` yang tervalidasi dari token JWT, mencegah kebocoran data antar pengguna (*IDOR protection*).
5. **Mitigasi Formula Injection (CWE-1236)**: Ekspor CSV secara otomatis menyanitasi karakter berbahaya (`=`, `+`, `-`, `@`) dengan *single-quote escaping*.

---

## 💻 2. Cara Menjalankan Aplikasi

### A. Lingkungan Pengembangan Lokal (Development)

1. **Jalankan Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
   *Server berjalan di `http://localhost:3000`*.

2. **Jalankan Frontend:**
   ```bash
   cd fintrack
   npm install
   npm run dev
   ```
   *Frontend berjalan di `http://localhost:5173`*.

3. **Jalankan Rangkaian Pengujian Otomatis (268 Assertions):**
   ```bash
   cd backend
   npm test
   ```

### B. Lingkungan Produksi (Production)

1. **Build Frontend:**
   ```bash
   cd fintrack
   npm run build
   ```
   Hasil build tersimpan di folder `fintrack/dist/` siap disajikan oleh static server, Nginx, Vercel, atau CDN.

2. **Menjalankan Backend:**
   ```bash
   cd backend
   npm run prisma:deploy
   npm start
   ```

---

## 🔑 3. Daftar Environment Variables

### A. Backend (`backend/.env`)

| Variabel | Wajib? | Default Lokal | Keterangan & Rekomendasi Produksi |
|---|:---:|---|---|
| `PORT` | Opsional | `3000` | Port listen server HTTP (biasanya diisi otomatis oleh platform hosting seperti Render/Railway). |
| `NODE_ENV` | **Wajib** | `development` | Wajib diatur ke `production` untuk mengaktifkan optimasi performa dan proteksi cookie ketat. |
| `DATABASE_URL` | **Wajib** | `"file:./dev.db"` | Jalur berkas SQLite (cth: `"file:/data/fintrack.db"`) atau URL PostgreSQL (cth: `"postgresql://user:pass@host:5432/db?schema=public"`). |
| `CLIENT_URL` | **Wajib** | `http://localhost:5173` | Domain frontend yang diizinkan CORS. Untuk beberapa domain pisahkan dengan koma: `https://app.fintrack.com,https://staging.fintrack.com`. |
| `JWT_SECRET` | **Wajib** | *(string acak)* | Kunci enkripsi JWT. **Wajib memiliki entropi tinggi minimal 32 karakter acak**. Contoh generate: `openssl rand -base64 32`. |
| `JWT_EXPIRES_IN` | Opsional | `15m` | Masa aktif Access Token JWT berumur pendek (rekomendasi: `15m` s/d `30m`). |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Opsional | `7` | Masa retensi sesi login refresh token di database (default: 7 hari). |
| `COOKIE_SAME_SITE` | Opsional | `lax` | Kebijakan cookie: gunakan `none` jika frontend dan backend beda domain (memerlukan HTTPS), gunakan `lax` atau `strict` jika satu domain/reverse proxy. |
| `COOKIE_SECURE` | Opsional | `false` | Wajib `true` pada produksi dengan protokol HTTPS. |

### B. Frontend (`fintrack/.env` atau `.env.production`)

| Variabel | Wajib? | Default Lokal | Keterangan & Rekomendasi Produksi |
|---|:---:|---|---|
| `VITE_API_URL` | **Wajib** | `http://localhost:3000/api` | Alamat basis REST API backend produksi, misalnya: `https://api.fintrack.com/api` atau `https://fintrack-backend.onrender.com/api`. |

> [!WARNING]
> Jangan pernah mengunggah berkas `.env` asli atau kredensial rahasia ke repository Git. Pastikan berkas `.gitignore` selalu aktif.

---

## 🗄️ 4. Pengelolaan & Migrasi Database

### A. Migrasi Database Aman di Produksi

Saat melakukan pembaruan skema di produksi:
1. **JANGAN gunakan `prisma migrate dev` di server produksi** karena perintah tersebut dapat mereset database jika terdeteksi *drift*.
2. **Gunakan selalu:**
   ```bash
   npx prisma migrate deploy
   ```
   Perintah ini hanya menerapkan migrasi yang belum terpasang tanpa merusak atau mereset data pengguna yang sudah ada.

### B. Strategi Persistensi Data SQLite di Cloud Hosting

Jika Anda memilih tetap menggunakan SQLite pada platform cloud seperti **Render**, **Railway**, atau **Fly.io**:
- **PERHATIAN KHUSUS**: Kontainer cloud umumnya bersifat *ephemeral* (berkas yang tersimpan di dalam kontainer akan hilang saat redeploy atau restart server).
- **Solusi**: Pasang **Persistent Disk / Persistent Volume**:
  - Pasang mount path volume (misal: `/data`).
  - Atur `DATABASE_URL="file:/data/fintrack.db"`.
  - Dengan persistent volume, data transaksi dan akun pengguna akan tetap aman dan persisten saat server di-restart atau di-update.

### C. Opsi Migrasi ke PostgreSQL (Skalabilitas Tinggi)

Jika proyek bertumbuh besar dan membutuhkan konkurensi tinggi:
1. Skema Prisma FinTrack telah dirancang modular.
2. Di [`backend/prisma/schema.prisma`](file:///d:/month-4/project-keuwangan/backend/prisma/schema.prisma), ubah `provider = "sqlite"` menjadi `provider = "postgresql"`.
3. Ganti `DATABASE_URL` ke database cloud PostgreSQL (seperti Supabase, Neon, atau Railway PostgreSQL).
4. Jalankan `npx prisma db push` atau buat migrasi baru.

---

## 🌐 5. Panduan Langkah Deployment

### Skenario Rekomendasi: Frontend di Vercel & Backend di Render / Railway

#### A. Deployment Frontend (Vercel)
1. Hubungkan repository GitHub ke **Vercel** (`https://vercel.com`).
2. Tentukan **Root Directory**: `fintrack`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Tambahkan **Environment Variable**:
   - `VITE_API_URL`: Masukkan URL Backend Anda (cth: `https://fintrack-api.onrender.com/api`).
7. Klik **Deploy**.

#### B. Deployment Backend (Render / Railway)
1. Buat **Web Service** baru dari repository.
2. Tentukan **Root Directory**: `backend`.
3. Runtime: **Node.js**.
4. Build Command:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
5. Start Command:
   ```bash
   npm start
   ```
6. Tambahkan **Environment Variables** pada dashboard hosting:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = *(Generate string acak 32+ karakter)*
   - `CLIENT_URL` = `https://fintrack.vercel.app` (URL Frontend Anda)
   - `COOKIE_SAME_SITE` = `none` (karena domain Vercel dan Render berbeda)
   - `COOKIE_SECURE` = `true` (karena menggunakan protokol HTTPS)
   - `DATABASE_URL` = `"file:/var/data/dev.db"` (atau URL Postgres)
7. Jika menggunakan SQLite: Tambahkan **Disk Storage** (Persistent Volume) pada path `/var/data` dengan ukuran minimal 1 GB.
8. Klik **Create Web Service**.

---

## 🛡️ 6. Pengaturan Domain, CORS, Cookie, & HTTPS

### A. Masalah Cookie Lintas Domain (*Cross-Origin*)
Ketika frontend berada di `https://fintrack.vercel.app` dan backend di `https://fintrack-api.onrender.com`:
- Browser memberlakukan aturan *Third-Party / Cross-Site Cookie*.
- Agar cookie `fintrack_refresh_token` tetap dapat dikirimkan:
  - Backend harus mengirim header: `Access-Control-Allow-Credentials: true`.
  - Cookie harus memiliki atribut: `SameSite=None; Secure; HttpOnly`.
  - Server wajib diakses via protokol **HTTPS**.

### B. Rekomendasi Terbaik: Custom Domain pada Subdomain Sama
Jika memiliki domain sendiri (misal: `myfintrack.id`):
- Frontend: `https://app.myfintrack.id`
- Backend API: `https://api.myfintrack.id`
- Keuntungan: Keduanya berada di root domain yang sama (*Same-Site*). Anda dapat menggunakan konfigurasi `COOKIE_SAME_SITE=lax` yang lebih ramah privasi browser tanpa terpengaruh pemblokiran cookie pihak ketiga.

---

## 💾 7. Prosedur Backup & Pemulihan Database

### A. Backup Otomatis / Manual Database SQLite

1. **Backup Manual (Hot-Backup Aman):**
   ```bash
   # Di Linux / Mac / Server Container:
   sqlite3 backend/prisma/dev.db ".backup 'backend/prisma/backup_$(date +%Y%m%d_%H%M%S).db'"
   
   # Atau via salinan berkas saat server tidak sibuk:
   cp backend/prisma/dev.db backend/prisma/dev.db.backup
   ```
2. **Jadwal Backup Otomatis (Cron Job Harian di Server Linux):**
   ```cron
   0 2 * * * cp /var/data/dev.db /var/backups/fintrack_$(date +\%F).db
   ```

### B. Pemulihan Database (Restore)
Jika terjadi insiden data:
1. Hentikan server backend: `kill <pid>` atau stop service di panel cloud.
2. Salin berkas cadangan kembali ke lokasi database aktif:
   ```bash
   cp /var/backups/fintrack_2026-10-19.db /var/data/dev.db
   ```
3. Restart server backend.
4. Lakukan verifikasi integritas data melalui aplikasi.

---

## ✅ 8. Checklist Verifikasi Pasca-Deployment

Setelah proses deployment selesai, jalankan checklist pengujian berikut langsung pada domain produksi:

- [ ] **1. Health Check Endpoint:**
  Buka `https://<backend-domain>/api/health` di browser. Respons harus berupa status `200 OK` dengan `database: Connected`.
- [ ] **2. SSL / HTTPS Aktif:**
  Pastikan ikon gembok hijau/aman muncul di browser untuk domain frontend dan backend.
- [ ] **3. Registrasi & Login Pengguna:**
  Daftarkan 1 akun baru pada domain produksi, pastikan token JWT diterima dan cookie sesi tersimpan.
- [ ] **4. Uji Mutasi Keuangan:**
  Buat transaksi baru, tambah dompet baru, dan atur anggaran bulanan. Pastikan angka total saldo dan kartu ringkasan ter-update real-time.
- [ ] **5. Uji Refresh Sesi (F5 / Reload Halaman):**
  Muat ulang halaman browser. Pastikan sesi login tidak hilang (silent refresh berhasil dijalankan tanpa mental ke halaman login).
- [ ] **6. Uji Ekspor & Cadangan:**
  - Klik **Ekspor CSV** di menu Laporan, pastikan file `.csv` terunduh dengan rapi.
  - Klik **Cadangan JSON**, pastikan payload data lengkap dan aman dari kebocoran hash password.
- [ ] **7. Uji Proteksi CORS:**
  Coba panggil API dari origin asing (misal via konsol browser di situs lain). Permintaan harus ditolak dengan status `403 Forbidden`.
- [ ] **8. Log Monitoring:**
  Periksa log di dashboard server hosting, pastikan tidak ada unhandled exception atau crash looping.
