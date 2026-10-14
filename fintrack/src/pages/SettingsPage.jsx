import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Shield,
  Download,
  Upload,
  CheckCircle,
  LogOut,
  FileSpreadsheet,
  Database,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Info,
  Filter
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  exportTransactionsCsvApi,
  exportBackupJsonApi,
  importBackupJsonApi
} from '../services/api';

export default function SettingsPage() {
  const {
    user,
    logout,
    token,
    wallets,
    allCategories,
    loadAllUserData
  } = useFinance();

  // Profile Form State
  const [userName, setUserName] = useState(user?.name || 'Pengguna FinTrack');
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // CSV Export Filter State
  const [csvType, setCsvType] = useState('all');
  const [csvCategory, setCsvCategory] = useState('all');
  const [csvWallet, setCsvWallet] = useState('all');
  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');
  const [csvSearch, setCsvSearch] = useState('');
  const [showCsvFilters, setShowCsvFilters] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // JSON Export State
  const [isExportingJson, setIsExportingJson] = useState(false);

  // Import JSON Modal & Execution State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState(null);
  const [importStats, setImportStats] = useState({
    transactions: 0,
    wallets: 0,
    budgets: 0,
    categories: 0,
    version: '1.0',
    exportedAt: null
  });
  const [importMode, setImportMode] = useState('merge'); // 'merge' or 'replace'
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importModalError, setImportModalError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.name) setUserName(user.name);
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // 1. Simpan Profil Pengguna
  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('Profil pengguna berhasil diperbarui.');
  };

  // 2. Ekspor Transaksi ke CSV
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    setErrorMessage(null);
    try {
      const filters = {
        type: csvType,
        category: csvCategory,
        wallet: csvWallet,
        startDate: csvStartDate,
        endDate: csvEndDate,
        search: csvSearch.trim()
      };

      const { blob, filename } = await exportTransactionsCsvApi(filters, token);

      // Trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Data transaksi berhasil diekspor ke ${filename}`);
    } catch (err) {
      showError(`Gagal mengekspor CSV: ${err.message}`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  // 3. Unduh Cadangan JSON (Full Backup)
  const handleExportJson = async () => {
    setIsExportingJson(true);
    setErrorMessage(null);
    try {
      const data = await exportBackupJsonApi(token);

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const dateStamp = new Date().toISOString().split('T')[0];
      link.download = `fintrack-backup-${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast('Cadangan akun lengkap berhasil diunduh.');
    } catch (err) {
      showError(`Gagal mengunduh cadangan JSON: ${err.message}`);
    } finally {
      setIsExportingJson(false);
    }
  };

  // 4. Pilih & Parsing Berkas Cadangan JSON
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar dapat memilih berkas yang sama ulang jika perlu
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          showError('Format berkas JSON tidak valid.');
          return;
        }

        const dataSection = parsed.data || parsed;
        const txList = Array.isArray(dataSection.transactions) ? dataSection.transactions : [];
        const wList = Array.isArray(dataSection.wallets) ? dataSection.wallets : [];
        const bList = Array.isArray(dataSection.budgets) ? dataSection.budgets : [];
        const cList = Array.isArray(dataSection.categories) ? dataSection.categories : [];

        if (txList.length === 0 && wList.length === 0 && bList.length === 0 && cList.length === 0) {
          showError('Berkas cadangan tidak memiliki data keuangan yang dapat dipulihkan.');
          return;
        }

        setImportStats({
          transactions: txList.length,
          wallets: wList.length,
          budgets: bList.length,
          categories: cList.length,
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || null
        });

        setImportPayload(parsed);
        setImportMode('merge');
        setIsConfirmed(false);
        setImportModalError(null);
        setIsImportModalOpen(true);
      } catch (err) {
        showError(`Gagal membaca berkas cadangan: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // 5. Eksekusi Pemulihan Data JSON ke Server
  const handleExecuteImport = async () => {
    if (!importPayload) return;
    if (!isConfirmed) {
      setImportModalError('Silakan centang persetujuan pemulihan data terlebih dahulu.');
      return;
    }

    setIsImporting(true);
    setImportModalError(null);

    try {
      const result = await importBackupJsonApi(importPayload, importMode, token);

      setIsImportModalOpen(false);
      setImportPayload(null);

      // Sinkronisasi data mutakhir ke seluruh aplikasi
      await loadAllUserData();

      const summary = result.summary || {};
      showToast(
        `Pemulihan berhasil! ${summary.transactions ?? 0} transaksi, ${summary.wallets ?? 0} dompet, ${summary.budgets ?? 0} anggaran dipulihkan.`
      );
    } catch (err) {
      setImportModalError(err.message || 'Gagal memulihkan cadangan data.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="settings-page">
      {/* Toast Notifikasi Berhasil */}
      {toastMessage && (
        <div className="alert-toast">
          <CheckCircle size={18} className="text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Toast Notifikasi Gagal */}
      {errorMessage && (
        <div className="alert-toast" style={{ background: '#7f1d1d' }}>
          <AlertTriangle size={18} className="text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Profil Pengguna</h2>
              <p className="panel-subtitle">Kelola informasi akun dan tampilan FinTrack</p>
            </div>
            <User size={20} className="text-muted" />
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Akun (Terdaftar)</label>
              <input
                type="email"
                value={user?.email || 'user@example.com'}
                readOnly
                className="form-input"
                style={{ opacity: 0.8, cursor: 'not-allowed', backgroundColor: 'var(--surface-color, #f8fafc)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mata Uang Utama</label>
              <select className="form-select" defaultValue="IDR">
                <option value="IDR">IDR (Rupiah Indonesia - Rp)</option>
                <option value="USD" disabled>USD (US Dollar - $)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Format Tanggal</label>
              <select className="form-select" defaultValue="id-ID">
                <option value="id-ID">Indonesia (DD/MM/YYYY - 12 Okt 2026)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary btn-sm">
                Simpan Profil
              </button>
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
                    logout();
                  }
                }}
              >
                <LogOut size={16} /> Keluar Akun
              </button>
            </div>
          </form>
        </div>

        {/* Data & Backup Card */}
        <div className="content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Cadangan & Ekspor Data</h2>
              <p className="panel-subtitle">Ekspor laporan spreadsheet atau cadangkan seluruh data ke JSON</p>
            </div>
            <Shield size={20} className="text-muted" />
          </div>

          <div className="backup-card-section">
            {/* 1. Ekspor CSV */}
            <div className="backup-option-card">
              <div className="backup-option-header">
                <div>
                  <div className="backup-option-title">
                    <FileSpreadsheet size={18} className="text-success" />
                    <span>Ekspor Transaksi ke CSV</span>
                  </div>
                  <p className="backup-option-desc">
                    Unduh riwayat mutasi keuangan dalam format tabel CSV yang aman dan siap dibuka di Microsoft Excel atau Google Sheets.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setShowCsvFilters(!showCsvFilters)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Filter size={14} />
                  <span>{showCsvFilters ? 'Sembunyikan Filter' : 'Sesuaikan Filter'}</span>
                </button>
              </div>

              {/* Opsi Filter CSV Dinamis */}
              {showCsvFilters && (
                <div className="csv-filter-grid">
                  <div className="csv-filter-field">
                    <label className="csv-filter-label">Tipe Mutasi</label>
                    <select
                      className="csv-filter-select"
                      value={csvType}
                      onChange={(e) => setCsvType(e.target.value)}
                    >
                      <option value="all">Semua Tipe</option>
                      <option value="income">Hanya Pemasukan</option>
                      <option value="expense">Hanya Pengeluaran</option>
                    </select>
                  </div>

                  <div className="csv-filter-field">
                    <label className="csv-filter-label">Kategori</label>
                    <select
                      className="csv-filter-select"
                      value={csvCategory}
                      onChange={(e) => setCsvCategory(e.target.value)}
                    >
                      <option value="all">Semua Kategori</option>
                      {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="csv-filter-field">
                    <label className="csv-filter-label">Dompet / Akun</label>
                    <select
                      className="csv-filter-select"
                      value={csvWallet}
                      onChange={(e) => setCsvWallet(e.target.value)}
                    >
                      <option value="all">Semua Dompet</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="csv-filter-field">
                    <label className="csv-filter-label">Dari Tanggal</label>
                    <input
                      type="date"
                      className="csv-filter-input"
                      value={csvStartDate}
                      onChange={(e) => setCsvStartDate(e.target.value)}
                    />
                  </div>

                  <div className="csv-filter-field">
                    <label className="csv-filter-label">Sampai Tanggal</label>
                    <input
                      type="date"
                      className="csv-filter-input"
                      value={csvEndDate}
                      onChange={(e) => setCsvEndDate(e.target.value)}
                    />
                  </div>

                  <div className="csv-filter-field">
                    <label className="csv-filter-label">Kata Kunci</label>
                    <input
                      type="text"
                      className="csv-filter-input"
                      placeholder="Cari transaksi..."
                      value={csvSearch}
                      onChange={(e) => setCsvSearch(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={handleExportCsv}
                  disabled={isExportingCsv}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isExportingCsv ? <Loader2 size={16} className="spin-animate" /> : <Download size={16} />}
                  <span>{isExportingCsv ? 'Menyiapkan CSV...' : 'Unduh Berkas CSV'}</span>
                </button>
              </div>
            </div>

            {/* 2. Unduh Cadangan JSON */}
            <div className="backup-option-card">
              <div className="backup-option-header">
                <div>
                  <div className="backup-option-title">
                    <Database size={18} className="text-primary" />
                    <span>Cadangan Akun Penuh (JSON)</span>
                  </div>
                  <p className="backup-option-desc">
                    Unduh arsip lengkap akun Anda yang mencakup transaksi, dompet, batas anggaran, dan kategori dinamis dari server backend.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleExportJson}
                  disabled={isExportingJson}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isExportingJson ? <Loader2 size={16} className="spin-animate" /> : <Download size={16} />}
                  <span>{isExportingJson ? 'Membuat Cadangan...' : 'Unduh Cadangan JSON'}</span>
                </button>
              </div>
            </div>

            {/* 3. Impor & Pemulihan JSON */}
            <div className="backup-option-card">
              <div className="backup-option-header">
                <div>
                  <div className="backup-option-title">
                    <Upload size={18} className="text-warning" />
                    <span>Pulihkan Data dari Berkas JSON</span>
                  </div>
                  <p className="backup-option-desc">
                    Pulihkan data transaksi dan dompet yang sebelumnya pernah diekspor. Proses diproteksi secara atomik di server database.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={16} />
                  <span>Pilih Berkas Cadangan (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Aplikasi */}
      <div className="content-panel app-info-panel">
        <div className="app-info-content">
          <div className="app-info-left">
            <h3>FinTrack v1.6 — Fitur Cadangan & Pemulihan Aman</h3>
            <p>
              Perlindungan Formula Injection (CWE-1236) pada CSV, transaksi database atomik Prisma, dan sanitasi rahasia autentikasi.
            </p>
          </div>
          <div className="app-badges">
            <span className="info-chip">Formula Safe CSV</span>
            <span className="info-chip">Atomic Rollback</span>
            <span className="info-chip">Zero Secret Leak</span>
            <span className="info-chip">Prisma ORM</span>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI PEMULIHAN DATA JSON */}
      {isImportModalOpen && (
        <div className="modal-backdrop" onClick={() => !isImporting && setIsImportModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Konfirmasi Pemulihan Data</h2>
                <p className="modal-subtitle">Periksa ringkasan berkas cadangan sebelum disimpan ke database</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => !isImporting && setIsImportModalOpen(false)}
                disabled={isImporting}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {importModalError && (
              <div className="form-error-alert" style={{ marginBottom: '14px' }}>
                <AlertTriangle size={16} />
                <span>{importModalError}</span>
              </div>
            )}

            {/* Ringkasan Data yang Ditemukan */}
            <div className="import-preview-grid">
              <div className="import-preview-card">
                <span className="import-preview-val">{importStats.transactions}</span>
                <span className="import-preview-label">Transaksi</span>
              </div>
              <div className="import-preview-card">
                <span className="import-preview-val">{importStats.wallets}</span>
                <span className="import-preview-label">Dompet</span>
              </div>
              <div className="import-preview-card">
                <span className="import-preview-val">{importStats.budgets}</span>
                <span className="import-preview-label">Anggaran</span>
              </div>
              <div className="import-preview-card">
                <span className="import-preview-val">{importStats.categories}</span>
                <span className="import-preview-label">Kategori</span>
              </div>
            </div>

            {importStats.exportedAt && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span>📅 Waktu Pembuatan Cadangan: </span>
                <strong>{new Date(importStats.exportedAt).toLocaleString('id-ID')}</strong>
                {importStats.version && <span> (Versi {importStats.version})</span>}
              </div>
            )}

            {/* Pilihan Metode Pemulihan: Merge vs Replace */}
            <label className="form-label" style={{ fontWeight: 700 }}>Pilih Metode Pemulihan:</label>
            <div className="import-mode-selection">
              <label
                className={`import-mode-option ${importMode === 'merge' ? 'active' : ''}`}
                onClick={() => setImportMode('merge')}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="import-mode-radio-input"
                />
                <div>
                  <strong style={{ fontSize: '14px' }}>Gabungkan Data (Merge) — Direkomendasikan</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Menambahkan seluruh catatan baru tanpa menghapus data yang telah ada. Dompet atau kategori dengan nama yang sama akan dihubungkan secara otomatis.
                  </p>
                </div>
              </label>

              <label
                className={`import-mode-option ${importMode === 'replace' ? 'danger-active' : ''}`}
                onClick={() => setImportMode('replace')}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="import-mode-radio-input"
                />
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--danger)' }}>Ganti Seluruh Data (Replace)</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Menghapus data transaksi, dompet, dan anggaran milik Anda saat ini, lalu menggantinya dengan data cadangan ini.
                  </p>
                </div>
              </label>
            </div>

            {/* Kotak Peringatan & Atomicity Notice */}
            <div className="import-warning-box">
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Jaminan Transaksi Atomik:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Seluruh pemulihan diproses dalam satu transaksi database Prisma. Jika ada kesalahan data atau nominal tidak valid, database akan di-rollback tanpa menyisakan data setengah jadi.
                </p>
              </div>
            </div>

            {/* Checkbox Konfirmasi */}
            <label className="import-confirm-checkbox">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <span>Saya telah memeriksa rincian di atas dan ingin melanjutkan proses pemulihan.</span>
            </label>

            {/* Tombol Aksi Modal */}
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImporting}
              >
                Batal
              </button>
              <button
                type="button"
                className={importMode === 'replace' ? 'btn-danger' : 'btn-primary'}
                onClick={handleExecuteImport}
                disabled={!isConfirmed || isImporting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isImporting ? <Loader2 size={16} className="spin-animate" /> : <Check size={16} />}
                <span>{isImporting ? 'Memproses di Server...' : 'Mulai Pemulihan Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
