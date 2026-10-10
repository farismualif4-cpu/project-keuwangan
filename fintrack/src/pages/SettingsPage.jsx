import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Smartphone,
  Globe,
  LogOut
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function SettingsPage() {
  const { transactions, budgets, resetToDefaultData, user, logout } = useFinance();
  const [userName, setUserName] = useState(user?.name || 'Pengguna FinTrack');
  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    if (user?.name) setUserName(user.name);
  }, [user]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      budgets
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          localStorage.setItem('fintrack_transactions_v1', JSON.stringify(parsed.transactions));
          if (parsed.budgets) {
            localStorage.setItem('fintrack_budgets_v1', JSON.stringify(parsed.budgets));
          }
          window.location.reload();
        } else {
          alert('Format berkas JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal memproses file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang data ke sampel bawaan awal? Semua perubahan akan diganti.')) {
      resetToDefaultData();
    }
  };

  return (
    <div className="settings-page">
      {savedAlert && (
        <div className="alert-toast">
          <CheckCircle size={18} />
          <span>Pengaturan profil berhasil disimpan!</span>
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
                <option value="id-ID">Indonesia (DD/MM/YYYY - 10 Okt 2026)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary btn-sm">
                Simpan Perubahan
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
              <h2 className="panel-title">Cadangan & Pemulihan Data</h2>
              <p className="panel-subtitle">Ekspor dan impor data transaksi lokal</p>
            </div>
            <Shield size={20} className="text-muted" />
          </div>

          <div className="backup-actions-list">
            <div className="backup-action-item">
              <div>
                <strong>Unduh Cadangan Lengkap (JSON)</strong>
                <p className="text-muted text-sm">Simpan salinan seluruh transaksi dan anggaran ke komputer Anda.</p>
              </div>
              <button className="btn-secondary btn-sm" onClick={handleExportJSON}>
                <Download size={16} /> Ekspor JSON
              </button>
            </div>

            <div className="backup-action-item">
              <div>
                <strong>Pulihkan Data dari JSON</strong>
                <p className="text-muted text-sm">Unggah file cadangan JSON yang pernah Anda simpan sebelumnya.</p>
              </div>
              <label className="btn-secondary btn-sm file-upload-btn">
                <Upload size={16} /> Impor File
                <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="backup-action-item danger-item">
              <div>
                <strong className="text-danger">Reset ke Data Sampel Awal</strong>
                <p className="text-muted text-sm">Kembalikan data ke dummy transaksi & budget bawaan FinTrack.</p>
              </div>
              <button className="btn-danger btn-sm" onClick={handleReset}>
                <RotateCcw size={16} /> Reset Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Info Card */}
      <div className="content-panel app-info-panel">
        <div className="app-info-content">
          <div className="app-info-left">
            <h3>FinTrack Frontend v1.0</h3>
            <p>Dibangun menggunakan React 19, Vite, Recharts, & Lucide Icons dengan performa kilat dan desain modern.</p>
          </div>
          <div className="app-badges">
            <span className="info-chip">React 19</span>
            <span className="info-chip">Vite HMR</span>
            <span className="info-chip">Local Persistence</span>
            <span className="info-chip">100% Client-Side</span>
          </div>
        </div>
      </div>
    </div>
  );
}
