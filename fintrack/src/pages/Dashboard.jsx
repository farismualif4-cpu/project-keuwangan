import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Plus,
  ArrowRight,
  Trash2,
  Layers,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Laptop,
  Gift,
  MoreHorizontal
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import CashflowChart from '../components/CashflowChart';
import ExpensePieChart from '../components/ExpensePieChart';
import WalletModal from '../components/WalletModal';

const iconLookup = {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Laptop,
  Gift,
  MoreHorizontal
};

export default function Dashboard() {
  const {
    metrics,
    transactions,
    wallets,
    categories,
    formatRupiah,
    formatShortDate,
    deleteTransaction,
    setIsAddModalOpen,
    setActivePage,
    isLoading
  } = useFinance();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const getCategoryMeta = (catId, type) => {
    const list = type === 'income' ? categories.income : categories.expense;
    return list.find((c) => c.id === catId) || { name: 'Umum', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: 'MoreHorizontal' };
  };

  const getWalletMeta = (wId) => {
    return wallets.find((w) => w.id === wId) || { name: 'Dompet' };
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Hapus transaksi "${title}" secara permanen dari database?`)) {
      deleteTransaction(id);
    }
  };

  const recentTxList = transactions.slice(0, 6);

  if (isLoading) {
    return (
      <div className="dashboard-page" style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Memuat data keuangan dari server...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* 4 Top KPI Stat Cards */}
      <section className="stats-grid">
        {/* Total Saldo */}
        <div className="stat-card card-primary">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-primary-soft">
              <Wallet size={24} className="text-primary-color" />
            </div>
            <span className="stat-badge badge-neutral">Semua Rekening</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Total Saldo Bersih</span>
            <h2 className="stat-amount">{formatRupiah(metrics.totalBalance)}</h2>
            <div className="stat-trend positive">
              <TrendingUp size={15} />
              <span>Likuiditas Sehat & Stabil</span>
            </div>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="stat-card card-income">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-success-soft">
              <ArrowUpRight size={24} className="text-success-color" />
            </div>
            <span className="stat-badge badge-success">+ Bulan Ini</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Total Pemasukan</span>
            <h2 className="stat-amount text-success-color">{formatRupiah(metrics.totalIncome)}</h2>
            <div className="stat-trend positive">
              <span>Dari {transactions.filter(t => t.type === 'income').length} sumber transaksi</span>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="stat-card card-expense">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-danger-soft">
              <ArrowDownRight size={24} className="text-danger-color" />
            </div>
            <span className="stat-badge badge-danger">Tercatat</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Total Pengeluaran</span>
            <h2 className="stat-amount text-danger-color">{formatRupiah(metrics.totalExpense)}</h2>
            <div className="stat-trend neutral">
              <span>Dari {transactions.filter(t => t.type === 'expense').length} kali transaksi</span>
            </div>
          </div>
        </div>

        {/* Rasio Tabungan */}
        <div className="stat-card card-savings">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-warning-soft">
              <PiggyBank size={24} className="text-warning-color" />
            </div>
            <span className="stat-badge badge-warning">Savings Rate</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Sisa Arus Kas Bersih</span>
            <h2 className="stat-amount">{formatRupiah(metrics.netSavings)}</h2>
            <div className="stat-trend positive">
              <span>{metrics.savingsRate}% dari pendapatan tersimpan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Grid: Charts */}
      <section className="charts-grid">
        {/* Cashflow Chart */}
        <div className="content-panel cashflow-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Tren Arus Kas (Pemasukan vs Pengeluaran)</h2>
              <p className="panel-subtitle">Grafik komparasi arus dana masuk dan keluar</p>
            </div>
            <span className="period-pill">Real-time</span>
          </div>
          <CashflowChart />
        </div>

        {/* Expense Category Breakdown */}
        <div className="content-panel pie-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Alokasi Pengeluaran</h2>
              <p className="panel-subtitle">Berdasarkan kategori terbesar</p>
            </div>
            <button 
              className="text-link-btn"
              onClick={() => setActivePage('reports')}
            >
              Detail <ArrowRight size={14} />
            </button>
          </div>
          <ExpensePieChart />
        </div>
      </section>

      {/* Bottom Grid: Recent Transactions & Wallets */}
      <section className="bottom-dashboard-grid">
        {/* Recent Transactions List */}
        <div className="content-panel transactions-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Transaksi Terkini</h2>
              <p className="panel-subtitle">Catatan mutasi keuangan terbaru</p>
            </div>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setActivePage('transactions')}
            >
              Lihat Semua ({transactions.length})
            </button>
          </div>

          <div className="recent-tx-list">
            {recentTxList.length === 0 ? (
              <div className="empty-tx-box">
                <Layers size={36} className="text-muted" />
                <p>Belum ada transaksi di database</p>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={16} /> Catat Transaksi Pertama
                </button>
              </div>
            ) : (
              recentTxList.map((tx) => {
                const cat = getCategoryMeta(tx.categoryId || tx.category, tx.type);
                const wallet = getWalletMeta(tx.walletId || tx.wallet);
                const IconComponent = iconLookup[cat.icon] || MoreHorizontal;
                const isInc = tx.type === 'income';

                return (
                  <div key={tx.id} className="tx-item-card">
                    <div className="tx-item-left">
                      <div 
                        className="tx-icon-avatar"
                        style={{ backgroundColor: cat.bg, color: cat.color }}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div className="tx-details">
                        <span className="tx-title">{tx.title}</span>
                        <div className="tx-meta-info">
                          <span className="tx-cat-badge">{cat.name}</span>
                          <span className="tx-dot">•</span>
                          <span className="tx-wallet-tag">{wallet.name}</span>
                          <span className="tx-dot">•</span>
                          <span className="tx-date-tag">{formatShortDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tx-item-right">
                      <span className={`tx-amount-text ${isInc ? 'text-income' : 'text-expense'}`}>
                        {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
                      <button
                        className="btn-delete-row"
                        onClick={() => handleDelete(tx.id, tx.title)}
                        title="Hapus transaksi"
                        aria-label="Hapus transaksi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Wallets & Quick Financial Health Card */}
        <div className="content-panel wallets-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Dompet & Rekening</h2>
              <p className="panel-subtitle">Distribusi saldo per akun</p>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setIsWalletModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CreditCard size={15} />
              <span>Kelola</span>
            </button>
          </div>

          <div className="wallets-list">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="wallet-item-row">
                <div className="wallet-info">
                  <div className="wallet-color-bar" style={{ backgroundColor: wallet.color }} />
                  <div>
                    <span className="wallet-name">{wallet.name}</span>
                    <span className="wallet-type">{wallet.type}</span>
                  </div>
                </div>
                <div className="wallet-balance">{formatRupiah(wallet.balance)}</div>
              </div>
            ))}
          </div>

          {/* Quick Financial Health Tips */}
          <div className="financial-tip-card">
            <div className="tip-header">
              <span className="tip-pill">Tips Keuangan</span>
            </div>
            <p className="tip-text">
              Rasio tabungan ideal adalah minimal <strong>20%</strong> dari pemasukan bulanan.
              Saat ini tabungan Anda adalah <strong>{metrics.savingsRate}%</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Modal Kelola Dompet & Rekening */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
}
