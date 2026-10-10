# FinTrack - Frontend Manajemen Keuangan Cerdas 💰

Aplikasi frontend manajemen keuangan modern, responsif, dan interaktif yang dibangun menggunakan **React 19**, **Vite**, **Recharts**, dan **Lucide Icons**.

---

## ✨ Fitur Utama

1. **Dashboard Eksekutif**:
   - Ringkasan Saldo Bersih, Total Pemasukan, Total Pengeluaran, dan Rasio Tabungan (*Savings Rate*).
   - Grafik interaktif Tren Arus Kas (*Cashflow Trend*) menggunakan Recharts.
   - Diagram donat alokasi pengeluaran per kategori.
   - Daftar mutasi transaksi terbaru dengan tombol hapus cepat.
   - Ringkasan saldo per dompet/rekening (BCA, Mandiri, Dompet Tunai, GoPay).

2. **Pencatatan Transaksi (+ Catat Transaksi)**:
   - Modal interaktif dengan tab Pemasukan & Pengeluaran.
   - Pilihan kategori lengkap dengan icon dan warna khas.
   - Pilihan sumber dana/dompet dan catatan transaksi.
   - Preview nominal instan dalam format Rupiah (`Rp`).

3. **Daftar Transaksi Lengkap**:
   - Filter berdasarkan jenis (Semua / Pemasukan / Pengeluaran).
   - Filter berdasarkan kategori.
   - Pencarian real-time berdasarkan judul transaksi atau catatan.
   - Pengurutan (*sorting*) berdasarkan tanggal atau nominal transaksi.
   - Ekspor transaksi ke format berkas **CSV**.

4. **Laporan & Analisis Finansial**:
   - Evaluasi kesehatan finansial berdasarkan **Aturan 50 / 30 / 20** (Kebutuhan Pokok 50%, Gaya Hidup 30%, Tabungan/Investasi 20%).
   - Analisis rasio tabungan otomatis.
   - Rincian tabel pengeluaran per pos kategori dengan progress bar visual.

5. **Manajemen Anggaran (Budgeting)**:
   - Atur batas (*limit*) pengeluaran per kategori secara interaktif.
   - Status badge otomatis: **Aman**, **Waspada (>80%)**, atau **Over Limit (>100%)**.

6. **Pengaturan & Cadangan Data**:
   - Sinkronisasi otomatis ke **LocalStorage**.
   - Unduh cadangan data lengkap dalam format **JSON**.
   - Pulihkan data dari berkas cadangan JSON.
   - Reset ke data awal demo kapan saja.

---

## 📁 Struktur Direktori

```
fintrack/
├── index.html                  # HTML entry point dengan Google Fonts Plus Jakarta Sans
├── vite.config.js              # Konfigurasi Vite & path alias (@/ -> src/)
├── package.json
└── src/
    ├── main.jsx                # React root mount
    ├── App.jsx                 # Layout utama, state provider, & routing halaman
    ├── index.css               # Desain sistem vanilla CSS modern
    ├── context/
    │   └── FinanceContext.jsx  # Global state manager, kalkulasi metrik, & LocalStorage
    ├── data/
    │   └── initialData.js      # Mock data awal realistis & helper currency Rupiah
    ├── components/
    │   ├── Sidebar.jsx         # Navigasi samping responsif
    │   ├── Header.jsx          # Topbar dengan tanggal, aksi ekspor, & tombol transaksi
    │   ├── TransactionModal.jsx# Dialog modal tambah transaksi
    │   ├── CashflowChart.jsx   # Grafik area Recharts tren arus kas
    │   └── ExpensePieChart.jsx # Diagram donat Recharts pengeluaran
    └── pages/
        ├── Dashboard.jsx       # Halaman ringkasan finansial utama
        ├── TransactionsPage.jsx# Halaman tabel & filter riwayat transaksi
        ├── ReportsPage.jsx     # Halaman laporan & evaluasi 50/30/20
        ├── BudgetPage.jsx      # Halaman manajemen batas anggaran
        └── SettingsPage.jsx    # Halaman profil & backup/restore data
```

---

## 🚀 Cara Menjalankan Project

Jalankan perintah berikut di terminal:

```bash
# 1. Masuk ke direktori project
cd fintrack

# 2. Jalankan development server
npm run dev
```

Buka URL lokal yang muncul (biasanya `http://localhost:5173`) di browser Anda.
