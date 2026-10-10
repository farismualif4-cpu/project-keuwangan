import React from 'react';
import { Menu, Plus, Calendar, Download } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function Header({ onOpenMobile }) {
  const { activePage, setIsAddModalOpen, transactions, isBackendConnected } = useFinance();

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: 'Ringkasan Keuangan', desc: 'Pantau arus kas, pemasukan, dan pengeluaran secara real-time.' };
      case 'transactions':
        return { title: 'Riwayat Transaksi', desc: 'Daftar seluruh mutasi keuangan dengan filter dan pencarian.' };
      case 'reports':
        return { title: 'Laporan & Analisis', desc: 'Statistik grafik pengeluaran, tren bulanan, dan rasio tabungan.' };
      case 'budgets':
        return { title: 'Manajemen Anggaran', desc: 'Kendalikan batas pengeluaran per kategori agar tidak boros.' };
      case 'settings':
        return { title: 'Pengaturan Akun', desc: 'Konfigurasi profil, preferensi mata uang, dan backup data.' };
      default:
        return { title: 'FinTrack', desc: 'Manajemen keuangan cerdas' };
    }
  };

  const { title, desc } = getPageTitle();

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = ['ID', 'Tanggal', 'Judul', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type,
      t.categoryId || t.category || '',
      t.amount,
      `"${(t.notes || t.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fintrack-transaksi-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <button 
          className="mobile-menu-trigger" 
          onClick={onOpenMobile}
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-titles">
          <h1 className="header-page-title">{title}</h1>
          <p className="header-page-desc">{desc}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Indikator Status Koneksi Backend API */}
        <div 
          className={`status-pill ${isBackendConnected ? 'status-success' : 'status-warning'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '5px 12px' }}
          title={isBackendConnected ? 'Terhubung ke REST API Node.js & Database SQLite' : 'Mode Offline (Menggunakan Cache Lokal)'}
        >
          <span 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b', 
              display: 'inline-block' 
            }} 
          />
          <span>{isBackendConnected ? 'API Connected' : 'Local Cache'}</span>
        </div>

        <div className="header-date-badge">
          <Calendar size={15} className="header-icon-accent" />
          <span>{todayFormatted}</span>
        </div>

        <button 
          className="btn-secondary btn-icon-only" 
          title="Ekspor CSV"
          onClick={handleExportCSV}
        >
          <Download size={18} />
          <span className="btn-label-desktop">Ekspor CSV</span>
        </button>

        <button 
          className="btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>+ Catat Transaksi</span>
        </button>
      </div>
    </header>
  );
}
