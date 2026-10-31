# 📊 Materi Lengkap Presentasi PPT — Project FinTrack
**Sistem Manajemen & Analitik Keuangan Personal (Full-Stack Modern Web Application)**

> **Petunjuk Penggunaan Dokumen:**  
> Dokumen ini dirancang sebagai panduan komprehensif pembuatan slide presentasi (PowerPoint / Google Slides / Canva / Keynote / Marp). Setiap slide telah dilengkapi dengan **Judul**, **Tujuan Komunikasi**, **Saran Tata Letak Visual (Layout)**, **Poin Konten Slide (On-Slide Text)**, **Metrik / Data Kunci**, dan **Naskah Pembicara (Speaker Notes / Script)** yang siap dibacakan saat presentasi.

---

## 📑 Daftar Isi Slide Deck (18 Slide)

1. [Slide 1: Judul & Pembuka (Title Slide)](#slide-1-judul--pembuka-title-slide)
2. [Slide 2: Latar Belakang & Permasalahan (The Problem)](#slide-2-latar-belakang--permasalahan-the-problem)
3. [Slide 3: Solusi Produk — FinTrack (The Solution & Value Proposition)](#slide-3-solusi-produk--fintrack-the-solution)
4. [Slide 4: Profil Target Pengguna & Persona (Target Audience)](#slide-4-profil-target-pengguna--persona)
5. [Slide 5: Fitur Utama 1 — Dashboard Eksekutif & Visualisasi Grafik](#slide-5-fitur-utama-1--dashboard-eksekutif--visualisasi-grafik)
6. [Slide 6: Fitur Utama 2 — Multi-Dompet & Saldo Dinamis](#slide-6-fitur-utama-2--multi-dompet--saldo-dinamis)
7. [Slide 7: Fitur Utama 3 — Smart Budgeting & Peringatan Dini](#slide-7-fitur-utama-3--smart-budgeting--peringatan-dini)
8. [Slide 8: Fitur Utama 4 — Evaluasi Kesehatan Finansial (Aturan 50/30/20)](#slide-8-fitur-utama-4--evaluasi-kesehatan-finansial-aturan-503020)
9. [Slide 9: Fitur Utama 5 — Portabilitas Data & Ekspor Aman](#slide-9-fitur-utama-5--portabilitas-data--ekspor-aman)
10. [Slide 10: Arsitektur Sistem & Tech Stack Terpadu](#slide-10-arsitektur-sistem--tech-stack-terpadu)
11. [Slide 11: Arsitektur Keamanan Berlapis (Defense in Depth)](#slide-11-arsitektur-keamanan-berlapis-defense-in-depth)
12. [Slide 12: Pemodelan Data & Skema Database (ERD)](#slide-12-pemodelan-data--skema-database-erd)
13. [Slide 13: Jaminan Kualitas & Hasil Pengujian Otomatis (QA & Testing)](#slide-13-jaminan-kualitas--hasil-pengujian-otomatis)
14. [Slide 14: Laporan Progres Sprint 30 Hari (Realisasi 83%)](#slide-14-laporan-progres-sprint-30-hari)
15. [Slide 15: Kesiapan Produksi & Panduan Deployment Cloud](#slide-15-kesiapan-produksi--panduan-deployment-cloud)
16. [Slide 16: Roadmap Pengembangan Masa Depan](#slide-16-roadmap-pengembangan-masa-depan)
17. [Slide 17: Panduan Skenario Demo Langsung (Live Demo Flow)](#slide-17-panduan-skenario-demo-langsung)
18. [Slide 18: Kesimpulan & Tanya Jawab (Closing & Q&A)](#slide-18-kesimpulan--tanya-jawab-closing--qa)

---

### Slide 1: Judul & Pembuka (Title Slide)

- **Judul Slide**: **FinTrack — Smart Personal Finance & Cashflow Tracking System**
- **Sub-judul**: Aplikasi Manajemen Keuangan Personal Full-Stack Berkecepatan Tinggi, Cerdas, dan Berstandar Keamanan Perbankan
- **Tujuan Slide**: Memperkenalkan nama produk, identitas proyek, dan kesan awal (*first impression*) yang profesional dan modern.
- **Saran Tata Letak Visual**:
  - Background: Gradien lembut bernuansa *Slate Dark / Indigo Soft* (`#0f172a` dengan aksen `#6366f1`).
  - Elemen Kiri: Logo FinTrack (Ikon Dompet / Grafik Finansial), Judul Besar, Tagline.
  - Elemen Kanan: Mockup bingkai laptop / browser yang menampilkan halaman Dashboard FinTrack.
  - Bagian Bawah: Nama Tim / Presenter, Peran (*Full-Stack Developer*), dan Tanggal Presentasi.
- **Poin Konten Slide**:
  - **Produk**: FinTrack Web Application
  - **Stack**: React 19 • Node.js • Express • Prisma ORM • SQLite/PostgreSQL
  - **Status**: Production-Ready (Sprint 3 — 83% Selesai, 268 Assertion Lulus 100%)
- **Naskah Pembicara (Speaker Notes)**:
  > *"Selamat pagi/siang rekan-rekan dan dewan penguji sekalian. Hari ini saya bangga mempersembahkan FinTrack — sebuah sistem manajemen dan analitik keuangan personal full-stack yang dirancang untuk membantu setiap individu mengontrol arus kas, memantau batas anggaran secara proaktif, dan mencapai kesehatan finansial dengan teknologi modern yang cepat dan aman."*

---

### Slide 2: Latar Belakang & Permasalahan (The Problem)

- **Judul Slide**: **Tantangan Pengelolaan Keuangan di Era Transaksi Digital**
- **Tujuan Slide**: Membangun empati audiens terhadap masalah nyata yang dihadapi masyarakat dalam mengatur keuangan pribadi harian.
- **Saran Tata Letak Visual**:
  - Layout 3 Kolom Kartu (*Card Layout*) dengan ikon peringatan merah/oranye untuk tiap masalah utama.
- **Poin Konten Slide**:
  1. **Fragmentasi Rekening & Saldo**:
     - Saldo tersebar tanpa sinkronisasi di berbagai bank (BCA, Mandiri), e-wallet (GoPay, OVO, ShopeePay), dan uang tunai.
     - Sulit mengetahui total kekayaan bersih riil (*net worth*) pada satu waktu.
  2. **Budgeting Blind Spots (Pemborosan Tak Terdeteksi)**:
     - Tidak adanya kontrol batas (*limit*) per kategori belanja.
     - Pengguna baru sadar kehabisan dana saat saldo sudah menipis di akhir bulan.
  3. **Ketiadaan Evaluasi Finansial Baku**:
     - Mayoritas pengguna mencatat pengeluaran tanpa mengetahui apakah komposisi keuangannya sehat (seperti rasio tabungan atau Aturan 50/30/20).
  4. **Kekhawatiran Privasi & Celah Keamanan**:
     - Banyak aplikasi mencatat data di spreadsheet rentan atau menyimpan token di *LocalStorage* browser yang rawan pencurian data lewat skrip jahat (XSS).
- **Data Pendukung**:
  - *Fakta*: Lebih dari 65% pekerja usia muda mengalami *cashflow deficit* akibat tidak memiliki sistem pemantauan pengeluaran harian yang terintegrasi.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Di era serba digital saat ini, uang kita berpindah dalam hitungan detik. Kita punya rekening BCA, Mandiri, dompet GoPay, dan uang cash di dompet. Masalah terbesarnya adalah: kita tidak tahu pasti berapa sisa likuiditas riil kita saat ini, ke mana perginya uang tersebut, dan apakah belanja kita sudah melampaui batas wajar. Dari sinilah FinTrack diciptakan sebagai solusi terpadu."*

---

### Slide 3: Solusi Produk — FinTrack (The Solution)

- **Judul Slide**: **FinTrack: Kendali Penuh Arus Kas dalam Satu Dasbor**
- **Tujuan Slide**: Menjelaskan proposisi nilai (*value proposition*) dan bagaimana FinTrack menyelesaikan setiap poin masalah di atas.
- **Saran Tata Letak Visual**:
  - Diagram solusi 4 pilar berbentuk pilar grid dengan ikon warna-warni kontras tinggi (*emerald*, *indigo*, *amber*, *blue*).
- **Poin Konten Slide**:
  - **Multi-Account Aggregation**: Menyatukan saldo Bank, Tunai, e-Wallet, dan Investasi dengan kalkulasi mutasi matematis tanpa *double counting*.
  - **Pencatatan Instan < 5 Detik**: Modal form cerdas dengan live preview format Rupiah otomatis saat mengetik nominal.
  - **Proactive Budget Guard**: Pengawasan limit anggaran real-time dengan status otomatis: *Aman*, *Waspada (≥80%)*, dan *Over Limit (>100%)*.
  - **Financial Intelligence**: Evaluasi kesehatan otomatis berbasis **Aturan 50 / 30 / 20** dan visualisasi grafik tren arus kas interaktif.
  - **Bank-Grade Data Protection**: Arsitektur keamanan ganda dengan isolasi data multi-tenant dan mitigasi formula injection (CWE-1236).
- **Naskah Pembicara (Speaker Notes)**:
  > *"FinTrack bukan sekadar buku kas digital biasa. FinTrack adalah asisten finansial cerdas. Aplikasi ini menggabungkan pencatatan cepat multi-rekening, kalkulasi otomatis tanpa rumus manual, visualisasi grafik yang intuitif, serta analisis kepatuhan anggaran yang langsung memberikan peringatan saat pengguna mendekati batas limit belanja."*

---

### Slide 4: Profil Target Pengguna & Persona

- **Judul Slide**: **Dirancang Khusus untuk Tiga Segmen Pengguna**
- **Tujuan Slide**: Menunjukkan bahwa produk dibangun dengan riset pengguna (*user-centric design*) yang terarah.
- **Saran Tata Letak Visual**:
  - 3 Profil Karakter (Avatar, Nama, Pekerjaan, Motivasi Utama, dan Fitur Favorit di FinTrack).
- **Poin Konten Slide**:
  1. **Rian (23 Tahun) — Fresh Graduate / Junior Dev**:
     - *Kebutuhan*: Mencatat jajan harian, kopi, dan makan siang dengan cepat di HP.
     - *Fitur Favorit*: Mobile drawer navigation, input modal cepat, quick balance preview di sidebar.
  2. **Sarah (29 Tahun) — Assistant Marketing Manager**:
     - *Kebutuhan*: Menerapkan alokasi gaji bulanan yang terencana dan mengejar target tabungan 20%.
     - *Fitur Favorit*: Kalkulator Aturan 50/30/20 di halaman Laporan, grafik tren arus kas 6 bulan.
  3. **Hendra (35 Tahun) — Freelancer / Pemilik Usaha Mikro**:
     - *Kebutuhan*: Arus kas fluktuatif, memisahkan dompet bisnis dan dompet pribadi, rekapan pembukuan.
     - *Fitur Favorit*: Multi-wallet support, filter transaksi multidimensi, ekspor CSV aman & backup data JSON.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Dalam merancang FinTrack, kami memetakan tiga persona utama: fresh graduate yang butuh pencatatan cepat harian di ponsel, profesional muda yang fokus pada evaluasi alokasi gaji bulanan 50/30/20, serta pekerja lepas atau UMKM yang membutuhkan pemisahan rekening bisnis dan ekspor rekapan data secara mandiri."*

---

### Slide 5: Fitur Utama 1 — Dashboard Eksekutif & Visualisasi Grafik

- **Judul Slide**: **Dashboard Finansial Eksekutif Real-Time**
- **Tujuan Slide**: Memperlihatkan antarmuka utama FinTrack yang kaya data namun tetap bersih (*clean & executive*).
- **Saran Tata Letak Visual**:
  - Tangkapan layar (*screenshot*) halaman Dashboard FinTrack.
  - Panggilan penunjuk panah (*callout badges*) ke 4 area krusial dashboard.
- **Poin Konten Slide**:
  - **5 Top KPI Cards**:
    1. *Total Saldo Seluruh Dompet* (Total likuiditas riil *lifetime*).
    2. *Total Pemasukan* (Dana masuk pada periode aktif).
    3. *Total Pengeluaran* (Beban keluar pada periode aktif).
    4. *Net Cashflow & Savings Rate* (Surplus/defisit dan rasio tabungan).
    5. *Sisa Plafon Anggaran* (Indikator kuantitas pos yang melampaui limit).
  - **Filter Periode Waktu Fleksibel**:
    - Tombol cepat: *Bulan Ini*, *Bulan Lalu*, *3 Bulan Terakhir*, dan *Rentang Kustom (Custom Date Range)*.
  - **Grafik Tren Arus Kas Interaktif (Recharts AreaChart)**:
    - Mode toggle tampilan: **Bulanan** (tren 6 bulan) atau **Harian** (dalam periode aktif) dengan custom tooltip Rupiah.
  - **Diagram Donut Komposisi Beban (Recharts PieChart)**:
    - Menampilkan total beban di bagian tengah donat dan persentase per pos pengeluaran.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Ketika pengguna membuka FinTrack, mereka langsung disambut oleh 5 kartu metrik utama. Tidak perlu menebak-nebak, saldo bersih dari semua rekening langsung terakumulasi. Pengguna dapat mengubah periode waktu analisis dengan satu klik, dan grafik tren arus kas dapat di-toggle antara rekap bulanan atau rincian harian secara interaktif."*

---

### Slide 6: Fitur Utama 2 — Multi-Dompet & Saldo Dinamis

- **Judul Slide**: **Manajemen Multi-Dompet Tanpa 'Double Counting'**
- **Tujuan Slide**: Membuktikan kekuatan logika kalkulasi finansial FinTrack yang akurat dan mencegah data korup.
- **Saran Tata Letak Visual**:
  - Ilustrasi alur kalkulasi saldo dompet: Saldo Awal + Mutasi Masuk - Mutasi Keluar = Saldo Riil.
  - Gambar kartu-kartu dompet (BCA, Mandiri, GoPay, Tunai) dengan warna dan ikon khas masing-masing.
- **Poin Konten Slide**:
  - **Dukungan 4 Tipe Dompet**: Perbankan (`Bank`), Uang Tunai (`Cash`), Dompet Digital (`e-Wallet`), dan Portofolio (`Investasi`).
  - **Kalkulasi Saldo Dinamis**:
    $$\text{Saldo Dompet} = \text{InitialBalance} + \sum \text{Pemasukan} - \sum \text{Pengeluaran}$$
  - **Bebas 'Magic Number'**: Tidak ada angka manipulatif; seluruh angka saldo terhubung langsung dengan mutasi database secara matematis.
  - **Proteksi Integritas Relasional**:
    - Sistem menolak penghapusan dompet jika masih memiliki transaksi terkait, menjamin riwayat keuangan historis tidak rusak.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Salah satu kelemahan terbesar aplikasi kasir sederhana adalah ketidaksinkronan antara transaksi dan saldo dompet. Di FinTrack, setiap dompet memiliki saldo awal dan saldo dinamis yang otomatis bertambah atau berkurang setiap kali ada transaksi. Kami juga menerapkan aturan integritas relasional: sebuah dompet tidak dapat dihapus jika masih ada riwayat transaksi yang melekat padanya."*

---

### Slide 7: Fitur Utama 3 — Smart Budgeting & Peringatan Dini

- **Judul Slide**: **Smart Budgeting: Kontrol Pengeluaran Sebelum Terlambat**
- **Tujuan Slide**: Memperlihatkan fitur pengendalian anggaran yang proaktif dan mencegah pemborosan.
- **Saran Tata Letak Visual**:
  - Tabel atau kartu perbandingan 3 status anggaran dengan warna badge: Hijau (*Aman*), Kuning (*Waspada*), Merah (*Over Limit*).
- **Poin Konten Slide**:
  - **Plafon Alokasi per Kategori**: Pengguna dapat menentukan batas maksimal pengeluaran bulanan per pos (misal: Makanan Rp 2.500.000, Transport Rp 800.000).
  - **3 Indikator Status Otomatis**:
    - 🟢 **Status Aman (< 80%)**: Belanja masih dalam kendali yang baik.
    - 🟡 **Status Waspada (80% – 100%)**: Peringatan visual bahwa plafon hampir habis.
    - 🔴 **Status Over Limit (> 100%)**: Notifikasi tegas bahwa pengeluaran telah melampaui rencana anggaran.
  - **Fitur Inline Quick-Edit**: Mengubah limit anggaran secara instan dari kartu tanpa harus berpindah halaman.
  - **Counter Over-Budget di Dashboard**: Menampilkan berapa pos yang jebol secara mencolok di halaman utama.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Budgeting di FinTrack tidak pasif. Ketika pengeluaran pengguna menyentuh 80% dari batas, kartu anggaran otomatis berubah warna menjadi kuning waspada. Dan jika melewati 100%, sistem langsung memberi badge merah dan menghitung berapa nominal kelebihan belanja tersebut. Pengguna juga dapat melakukan inline edit untuk menyesuaikan limit kapan saja."*

---

### Slide 8: Fitur Utama 4 — Evaluasi Kesehatan Finansial (Aturan 50/30/20)

- **Judul Slide**: **Laporan Finansial: Evaluasi Standar Aturan 50 / 30 / 20**
- **Tujuan Slide**: Mengedukasi audiens mengenai fitur analitik finansial unggulan FinTrack yang melampaui sekadar pembukuan biasa.
- **Saran Tata Letak Visual**:
  - Diagram visual 3 porsi kue (Pie) atau progress bar bertingkat: 50% Kebutuhan, 30% Keinginan, 20% Tabungan.
- **Poin Konten Slide**:
  - **Standar Finansial Teruji**: Mengadopsi prinsip perencanaan keuangan Elizabeth Warren (*50/30/20 Rule*).
  - **Pembagian Kategori Otomatis**:
    - **50% Kebutuhan Pokok (Needs)**: Makanan pokok, tempat tinggal, transportasi harian, utilitas/tagihan, kesehatan, pendidikan.
    - **30% Gaya Hidup & Keinginan (Wants)**: Rekreasi, belanja pakaian, kafe/hiburan, langganan streaming.
    - **20% Tabungan & Investasi (Savings)**: Akumulasi surplus kas bersih dan pos investasi masa depan.
  - **Health Score Card**:
    - Memberikan penilaian apakah alokasi keuangan pengguna berstatus *Sehat*, *Perlu Penyesuaian*, atau *Berisiko Tinggi*.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Banyak orang bertanya: apakah pengeluaran saya bulan ini wajar? Di halaman Laporan FinTrack, kami menyematkan kalkulator Aturan 50/30/20 otomatis. Sistem mengklasifikasikan transaksi pengguna ke dalam Kebutuhan Pokok maksimal 50%, Gaya Hidup maksimal 30%, dan Tabungan minimal 20%. Pengguna bisa langsung melihat apakah gaya hidup mereka melebihi porsi yang sehat."*

---

### Slide 9: Fitur Utama 5 — Portabilitas Data & Ekspor Aman

- **Judul Slide**: **Portabilitas & Kedaulatan Data Pengguna**
- **Tujuan Slide**: Memperlihatkan bahwa FinTrack menghargai kepemilikan data pengguna (*data sovereignty*) dan keamanannya.
- **Saran Tata Letak Visual**:
  - Dua kartu berdampingan: Ekspor CSV Anti-Injeksi dan Backup/Restore JSON Atomik.
- **Poin Konten Slide**:
  - **Ekspor CSV Terproteksi (Mitigasi CWE-1236)**:
    - Rekap transaksi dapat diunduh ke format berkas `.csv`.
    - Dilengkapi *formula escaping* otomatis: teks yang diawali karakter `=`, `+`, `-`, atau `@` disanitasi dengan kutip tunggal (`'`) agar aman saat dibuka di Microsoft Excel atau Google Sheets.
  - **Cadangan Penuh JSON Atomik**:
    - Pengguna dapat mengunduh seluruh data akun (profil, dompet, mutasi transaksi, kategori, anggaran) dalam satu file `.json`.
    - Bebas dari kebocoran hash password.
  - **Pemulihan Data (Restore) Aman**:
    - Unggah berkas JSON cadangan untuk merestore data dengan transaksi database atomik Prisma (`prisma.$transaction`).
- **Naskah Pembicara (Speaker Notes)**:
  > *"Kami percaya bahwa data finansial adalah milik mutlak pengguna. Pengguna dapat mengekspor rekap mutasi ke format CSV kapan saja. Yang istimewa, ekspor CSV FinTrack telah disanitasi dari celah keamanan CWE-1236 Formula Injection. Pengguna juga dapat mengunduh file backup JSON lengkap dan merestore datanya ke perangkat lain dengan aman."*

---

### Slide 10: Arsitektur Sistem & Tech Stack Terpadu

- **Judul Slide**: **Arsitektur Sistem & Ekosistem Teknologi**
- **Tujuan Slide**: Menjelaskan fondasi teknis full-stack yang modern, decoupled, dan berperforma tinggi.
- **Saran Tata Letak Visual**:
  - Diagram arsitektur 3 tier: Klien (Frontend) $\leftrightarrow$ Server API (Backend) $\leftrightarrow$ Database Persisten.
- **Poin Konten Slide**:
  - **Frontend Client (SPA)**:
    - **React 19 & Vite 8**: Performa render cepat dengan optimasi bundler Rolldown.
    - **Visualisasi & Ikon**: Pustaka `recharts` dan `lucide-react`.
    - **Design System**: Vanilla CSS Modern dengan variabel kustom tanpa overhead framework berat.
    - **Code Splitting**: Chunk vendor terpisah (`vendor-react`, `vendor-charts`, `vendor-icons`), kompilasi build hanya **1.09 detik**!
  - **Backend Server (REST API)**:
    - **Node.js & Express.js**: Arsitektur berlapis (*layered architecture*: Controllers, Middlewares, Routes, Services).
    - **Modular Security**: Helmet-like security headers, CORS dynamic whitelist, cookie-parser.
  - **Database & ORM**:
    - **Prisma ORM v6**: Type-safe query builder, migrasi skema terotomasi.
    - **Penyimpanan**: SQLite lokal (Development) & Siap migrasi ke PostgreSQL managed (Production).
- **Naskah Pembicara (Speaker Notes)**:
  > *"Dari sisi arsitektur rekayasa perangkat lunak, FinTrack menggunakan decoupled architecture antara React 19 di sisi klien dan Node.js Express di sisi server. Komunikasi berlangsung melalui REST API dengan Prisma ORM sebagai jembatan ke database. Berkat optimasi manual code-splitting di Vite, waktu kompilasi build frontend kami tembus 1.09 detik saja."*

---

### Slide 11: Arsitektur Keamanan Berlapis (Defense in Depth)

- **Judul Slide**: **Arsitektur Keamanan: Keamanan Berlapis (Defense in Depth)**
- **Tujuan Slide**: Menonjolkan keunggulan sistem keamanan FinTrack yang melampaui aplikasi web pada umumnya.
- **Saran Tata Letak Visual**:
  - Diagram bertingkat perisai keamanan (*Security Shield*) dengan 5 pilar pertahanan.
- **Poin Konten Slide**:
  1. **In-Memory Access Token (Anti-XSS)**:
     - Access Token berumur pendek (15 menit) hanya disimpan di memori runtime JavaScript (`api.js`).
     - **Bebas dari LocalStorage**: Script jahat penyusup (XSS) tidak bisa mencuri token dari storage browser.
  2. **HttpOnly Secure Cookie (RFC 6749 Token Rotation)**:
     - Refresh token disimpan di cookie dengan flag `HttpOnly`, `SameSite`, dan `Secure`.
     - Setiap rotasi token mendeteksi penggunaan ulang (*token reuse detection*). Jika terjadi anomali, seluruh sesi pengguna otomatis dicabut.
  3. **Double-Submit CSRF Protection**:
     - Memverifikasi header `X-CSRF-Token` pada seluruh mutasi data (`POST`, `PUT`, `DELETE`).
  4. **Multi-Tenant Data Isolation (Anti-IDOR)**:
     - Seluruh query database diikat secara ketat dengan `userId: req.user.id`. Pengguna A tidak akan pernah bisa mengakses atau memodifikasi data Pengguna B.
  5. **Bcrypt Password Hashing**:
     - Password dienkripsi dengan salt rounds 10+. Hash password tidak pernah dikirimkan ke frontend.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Keamanan adalah prioritas nomor satu kami. FinTrack tidak pernah menyimpan Access Token di LocalStorage browser karena rawan serangan XSS. Token hanya ada di memori. Untuk sesi berkelanjutan, kami menggunakan HttpOnly Cookie dengan rotasi token standar RFC 6749. Seluruh request mutasi dilindungi token anti-CSRF, dan setiap query database diisolasi per akun pengguna sehingga kebal dari celah IDOR."*

---

### Slide 12: Pemodelan Data & Skema Database (ERD)

- **Judul Slide**: **Struktur Basis Data Relasional yang Tangguh**
- **Tujuan Slide**: Memperlihatkan desain tabel database dan integritas relasionalnya (*relational integrity*).
- **Saran Tata Letak Visual**:
  - Diagram ERD bersih yang menghubungkan 6 model utama Prisma.
- **Poin Konten Slide**:
  - **Tabel `User`**: Kredensial pengguna, nama, email unik, timestamp.
  - **Tabel `Wallet`**: Rekening dompet (`Bank`, `Cash`, `e-Wallet`), saldo awal, ikon visual, relasi cascade ke User.
  - **Tabel `Category`**: Pos mutasi pemasukan/pengeluaran dengan pemisahan kategori sistem (`isSystem: true`) vs kustom pengguna.
  - **Tabel `Transaction`**: Data mutasi riil (nominal, tanggal, dompet, kategori, catatan).
  - **Tabel `Budget`**: Plafon batas pengeluaran bulanan per pos kategori dengan constraint unique `[userId, categoryId, period]`.
  - **Tabel `RefreshToken`**: Hash sesi login aktif, pelacakan revoked status, dan rantai rotasi token pengganti.
- **Integritas Data**:
  - Menggunakan index `@@unique` dan `@@index([userId])` untuk pencarian data berkecepatan tinggi.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Basis data FinTrack dibangun di atas Prisma ORM dengan skema relasional yang bersih. Terdiri dari 6 model utama: User, Wallet, Category, Transaction, Budget, dan RefreshToken. Setiap tabel memiliki relasi yang terdefinisi jelas dengan proteksi cascading delete dan indeks untuk memastikan eksekusi query tetap kencang meskipun data transaksi mencapai puluhan ribu baris."*

---

### Slide 13: Jaminan Kualitas & Hasil Pengujian Otomatis

- **Judul Slide**: **Quality Assurance: 268 Assertion Lulus 100%**
- **Tujuan Slide**: Memberikan bukti konkret (*hard evidence*) mengenai stabilitas dan keandalan sistem.
- **Saran Tata Letak Visual**:
  - Tabel hasil pengujian 7 Test Suite dengan indikator hijau `100% PASS (0 FAILED)`.
  - Badge besar: `268 / 268 ASSERTIONS PASSED`.
- **Poin Konten Slide**:
  - **Rangkaian Test Suite Otomatis Backend**:
    | Test Suite | Ruang Lingkup Pengujian | Hasil Pengujian |
    |---|---|:---:|
    | `test-api.js` | Health Check & Endpoint CRUD Transaksi Dasar | **20 / 20 PASS** |
    | `test-auth.js` | Registrasi, Login, Bcrypt, Isolasi Multi-Tenant | **27 / 27 PASS** |
    | `test-wallets-budgets.js` | CRUD Dompet, Limit Anggaran, Integritas Relasi | **32 / 32 PASS** |
    | `test-tahap4.js` | Kategori Sistem/Kustom, Filter Multidimensi | **45 / 45 PASS** |
    | `test-tahap5.js` | HttpOnly Cookie, Rotasi RFC 6749, Proteksi CSRF | **36 / 36 PASS** |
    | `test-tahap6.js` | Ekspor CSV anti-CWE-1236, Backup/Restore JSON | **53 / 53 PASS** |
    | `test-tahap7.js` | Dashboard KPI, Analitik Harian/Bulanan, Multi-Tenant | **55 / 55 PASS** |
  - **Total**: **268 dari 268 Assertion Lulus (Tingkat Kelulusan 100%)**!
  - **Frontend Verification**: Build kompilasi Vite sukses tanpa error dan tanpa warning ukuran file.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Kami tidak hanya mengklaim bahwa aplikasi kami bekerja, kami membuktikannya melalui pengujian otomatis. FinTrack memiliki rangkaian automated integration testing komprehensif dari Tahap 1 hingga Tahap 7. Sebanyak 268 assertion pengujian dijalankan — mencakup pengujian otentikasi, kalkulasi saldo, integritas multi-tenant, hingga uji ketahanan formula injection — dan seluruhnya lulus 100% tanpa ada satu pun kegagalan."*

---

### Slide 14: Laporan Progres Sprint 30 Hari (Realisasi 83%)

- **Judul Slide**: **Status Realisasi Proyek (Sprint 30 Hari)**
- **Tujuan Slide**: Menjelaskan timeline pengerjaan proyek secara transparan, profesional, dan terukur.
- **Saran Tata Letak Visual**:
  - Donut Chart progres: 83% Selesai (Hijau) vs 17% Dalam Pipeline (Abu-abu).
  - Timeline horizontal menunjukkan Sprint 1, Sprint 2, dan Sprint 3.
- **Poin Konten Slide**:
  - **Total Bobot Kerja**: **88 Story Points (SP)**
  - **Bobot Selesai**: **73 Story Points (83.0%)**
  - **Rincian Penyelesaian per Sprint**:
    - **Sprint 1 (Hari 1 – 10)**: *Frontend MVP & State Client* $\rightarrow$ **34 SP (100% Selesai)**
    - **Sprint 2 (Hari 11 – 20)**: *Backend Engine, Database & Auth* $\rightarrow$ **26 SP (100% Selesai)**
    - **Sprint 3 (Hari 21 – 30)**: *Integrasi Full-Stack & QA/Deployment* $\rightarrow$ **13 SP Selesai (Total 16 dari 19 Task Tuntas)**
  - **Task Selesai di Sprint 3**:
    - `TASK-14`: Integrasi Service Layer Client & FetchWithAuth Auto-Refresh.
    - `TASK-15`: Halaman Autentikasi Pengguna di Frontend.
    - `TASK-18`: QA Testing, Automated Test Suite & Audit Keamanan OWASP.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Sesuai dengan dokumen resmi Sprint Plan 30 Hari, proyek ini telah mencapai 83% penyelesaian total dengan 73 dari 88 Story Points telah terealisasi penuh. Sprint 1 untuk Frontend MVP selesai 100%, Sprint 2 untuk arsitektur Backend selesai 100%, dan saat ini kita berada di Sprint 3 di mana integrasi full-stack dan pengujian kualitas telah tuntas dikerjakan."*

---

### Slide 15: Kesiapan Produksi & Panduan Deployment Cloud

- **Judul Slide**: **Kesiapan Produksi & Strategi Rilis Cloud**
- **Tujuan Slide**: Memperlihatkan bahwa aplikasi sudah siap dideploy ke server publik dengan panduan resmi `DEPLOYMENT.md`.
- **Saran Tata Letak Visual**:
  - Diagram arsitektur deployment cloud: Frontend di Vercel CDN $\rightarrow$ Backend di Web Service Render/Railway $\rightarrow$ Volume Disk Persisten.
- **Poin Konten Slide**:
  - **Panduan Resmi Produksi**: Diterbitkan berkas panduan [**`DEPLOYMENT.md`**](file:///d:/month-4/project-keuwangan/DEPLOYMENT.md) mencakup seluruh konfigurasi environment variables dan migrasi database.
  - **Strategi Hosting Terpisah (Decoupled Cloud Hosting)**:
    - **Frontend**: Di-deploy pada platform **Vercel** / Cloudflare Pages dengan build command `npm run build` dan distribusi CDN global.
    - **Backend API**: Di-deploy pada **Render** / Railway menggunakan Node.js Web Service.
    - **Persistensi Database**: Menggunakan *Persistent Storage Volume* untuk SQLite (path `/data`) atau koneksi cloud PostgreSQL.
  - **Hardening Produksi yang Telah Terpasang**:
    - Dynamic parsing `CLIENT_URL` untuk multi-origin.
    - Dukungan konfigurasi `COOKIE_SAME_SITE=none` dan `COOKIE_SECURE=true` untuk komunikasi HTTPS lintas domain.
    - Skrip migrasi aman: `npm run prisma:deploy` (tanpa risiko reset data pengguna).
- **Naskah Pembicara (Speaker Notes)**:
  > *"FinTrack telah dirancang siap produksi. Kami telah menerbitkan panduan komprehensif DEPLOYMENT.md. Strategi rilis yang kami siapkan adalah decoupled hosting: frontend di Vercel untuk kecepatan akses CDN global, dan backend di Render atau Railway dengan persistent storage. Konfigurasi cookie HTTPS lintas-domain dan skrip migrasi database aman telah siap digunakan."*

---

### Slide 16: Roadmap Pengembangan Masa Depan

- **Judul Slide**: **Roadmap Inovasi & Pengembangan Selanjutnya**
- **Tujuan Slide**: Menunjukkan visi jangka panjang produk dan 3 task tersisa di Sprint 3.
- **Saran Tata Letak Visual**:
  - Timeline roadmap 4 kuartal / tahap (*Upcoming Phases*) dengan ikon fitur futuristik.
- **Poin Konten Slide**:
  - **Tahap Berikutnya (Penyelesaian Sprint 3 - 15 SP)**:
    1. **TASK-16**: Fitur Transaksi Berulang (*Recurring Transactions*) berbasis cron job backend dan Modal Transfer Saldo antar rekening dompet.
    2. **TASK-17**: Ekspor Laporan Bulanan ke format dokumen PDF resmi siap cetak dan ekstraksi nota struk kasir berbasis OCR.
    3. **TASK-19**: Kontainerisasi `Dockerfile` multi-stage, `docker-compose.yml`, dan otomatisasi CI/CD GitHub Actions.
  - **Pengembangan Jangka Panjang**:
    - Aplikasi Mobile berbasis React Native.
    - Fitur AI Financial Advisor untuk prediksi arus kas dan rekomendasi penghematan bulanan otomatis.
    - Integrasi Open Finance API untuk rekonsiliasi mutasi bank secara langsung.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Pengembangan FinTrack tidak berhenti di sini. Sisa 17% dari sprint akan melengkapi fitur mutasi berulang dengan cron job, transfer saldo antar rekening, ekspor dokumen PDF resmi, dan pembaca nota kasir otomatis berbasis OCR. Ke depannya, kami juga merencanakan integrasi kecerdasan buatan untuk rekomendasi penghematan dan aplikasi mobile."*

---

### Slide 17: Panduan Skenario Demo Langsung (Live Demo Flow)

- **Judul Slide**: **Skenario Demonstrasi Sistem (Live Demo Flow)**
- **Tujuan Slide**: Menjadi panduan langkah demi langkah saat sesi demo langsung aplikasi di hadapan audiens/penguji.
- **Saran Tata Letak Visual**:
  - Infografis 5 langkah berurutan (*step-by-step numbered flowchart*).
- **Poin Konten Slide**:
  1. **Langkah 1: Autentikasi Pengguna**:
     - Masuk menggunakan tombol *Quick Demo Login* di halaman `AuthPage.jsx`.
     - Tunjukkan silent-session refresh berjalan mulus.
  2. **Langkah 2: Menjelajahi Dashboard Eksekutif**:
     - Sorot 5 kartu KPI (Total Saldo, Pemasukan, Pengeluaran, Savings Rate, Plafon Anggaran).
     - Ganti filter periode (*This Month* ke *Last Month*) dan perhatikan angka serta grafik Recharts berubah real-time.
  3. **Langkah 3: Pencatatan Transaksi & Validasi Saldo**:
     - Buka modal `+ Catat Transaksi`.
     - Ketik nominal dan tunjukkan live preview format Rupiah.
     - Simpan mutasi, perhatikan saldo dompet terkait langsung bertambah/berkurang seketika.
  4. **Langkah 4: Manajemen Anggaran & Indikator Waspada**:
     - Buka menu Anggaran (`BudgetPage.jsx`), lakukan inline edit limit.
     - Perlihatkan perubahan status badge dari *Aman* menjadi *Waspada* atau *Over Limit*.
  5. **Langkah 5: Portabilitas Data & Ekspor Aman**:
     - Masuk ke menu Pengaturan/Riwayat, klik **Ekspor CSV**.
     - Buka file CSV dan tunjukkan sanitasi kutip satu (`'`) untuk proteksi formula injection.
- **Naskah Pembicara (Speaker Notes)**:
  > *"Sekarang mari kita lihat FinTrack secara langsung dalam skenario demo. Kita akan mulai dari login instan satu klik, melihat responsivitas filter dashboard, mencatat transaksi pengeluaran baru dengan preview nominal Rupiah, menguji batas anggaran kategori, hingga mengunduh berkas laporan CSV yang aman dari injeksi formula."*

---

### Slide 18: Kesimpulan & Tanya Jawab (Closing & Q&A)

- **Judul Slide**: **Kesimpulan & Sesi Tanya Jawab**
- **Tujuan Slide**: Menutup presentasi dengan pesan kunci yang kuat dan membuka sesi diskusi/evaluasi.
- **Saran Tata Letak Visual**:
  - Ringkasan 3 poin pilar pencapaian FinTrack di sebelah kiri.
  - Teks besar *"Terima Kasih • Q & A"* di sebelah kanan beserta tautan repositori proyek.
- **Poin Konten Slide**:
  - **Pencapaian Utama FinTrack**:
    - ⚡ **Cepat & Responsif**: Dibangun dengan React 19 & Vite (waktu kompilasi build 1.09s).
    - 🛡️ **Aman & Andal**: In-memory token, HttpOnly RFC 6749, anti-CSRF, dan 268 uji otomatis lulus 100%.
    - 💡 **Cerdas & Berdaya Guna**: Agregasi multi-rekening, smart budgeting, dan evaluasi Aturan 50/30/20.
  - **Tautan & Repositori**:
    - Dokumentasi PRD: [**`PRD.md`**](file:///d:/month-4/project-keuwangan/PRD.md)
    - Panduan Deployment: [**`DEPLOYMENT.md`**](file:///d:/month-4/project-keuwangan/DEPLOYMENT.md)
    - Sprint Report: [**`SPRINT_30_DAYS.md`**](file:///d:/month-4/project-keuwangan/fintrack/SPRINT_30_DAYS.md)
- **Naskah Pembicara (Speaker Notes)**:
  > *"Sebagai penutup, FinTrack hadir bukan hanya untuk mencatat mutasi angka, tetapi untuk memberi kebebasan dan kejelasan finansial bagi penggunanya melalui sistem yang cepat, cerdas, dan aman. Terima kasih banyak atas perhatian rekan-rekan dan dewan penguji sekalian. Saya dengan senang hati menyambut pertanyaan, masukan, dan diskusi lebih lanjut."*

---

## 💡 Tips & Panduan Teknis Pembuatan Slide (Slide Production Checklist)

1. **Skema Warna Rekomendasi (Financial Modern Palette)**:
   - Primary Brand: **Deep Indigo** (`#4f46e5` / `#6366f1`)
   - Success / Income: **Emerald Green** (`#10b981`)
   - Danger / Expense: **Rose / Crimson Red** (`#ef4444`)
   - Warning / Alert: **Amber Gold** (`#f59e0b`)
   - Background Canvas: **Slate Dark** (`#0f172a` untuk dark mode) atau **Pure White / Slate Light** (`#f8fafc` untuk light mode)
2. **Tipografi**:
   - Gunakan font modern sans-serif: **Plus Jakarta Sans**, **Inter**, atau **Poppins**.
3. **Tips Penyampaian (Presentation Delivery)**:
   - Alokasikan waktu sekitar **7 hingga 10 menit** untuk total 18 slide (rata-rata 30–45 detik per slide).
   - Sisihkan minimal **2 hingga 3 menit** khusus untuk demonstrasi aplikasi langsung (*live demo*) sesuai panduan Slide 17.
