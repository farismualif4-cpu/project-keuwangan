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
  MoreHorizontal,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
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
    isLoading,
    periodFilter,
    setPeriodFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    analyticsLoading,
    fetchAnalyticsSummary
  } = useFinance();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const getCategoryMeta = (catId, type) => {
    const list = type === 'income' ? (categories?.income || []) : (categories?.expense || []);
    return list.find((c) => c.id === catId) || {
      name: 'Umum',
      color: '#64748b',
      bg: 'rgba(100,116,139,0.1)',
      icon: 'MoreHorizontal'
    };
  };

  const getWalletMeta = (wId) => {
    return (wallets || []).find((w) => w.id === wId) || { name: 'Dompet' };
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Hapus transaksi "${title}" secara permanen dari database?`)) {
      try {
        await deleteTransaction(id);
      } catch (err) {
        alert('Gagal menghapus transaksi: ' + err.message);
      }
    }
  };

  const recentTxList = (transactions || []).slice(0, 6);

  // Periode Label Helper
  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'last_month':
        return 'Bulan Sebelumnya';
      case 'last_3_months':
        return '3 Bulan Terakhir';
      case 'custom':
        return 'Rentang Khusus';
      case 'this_month':
      default:
        return 'Bulan Ini';
    }
  };

  if (isLoading && (!transactions || transactions.length === 0)) {
    return (
      <div className="dashboard-page" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
          Memuat data analitik keuangan dari server...
        </p>
      </div>
    );
  }

  const incomeTxCount = (transactions || []).filter((t) => t.type === 'income').length;
  const expenseTxCount = (transactions || []).filter((t) => t.type === 'expense').length;

  return (
    <div className="dashboard-page">
      {/* =========================================================================
          PERIOD FILTER TOOLBAR
          ========================================================================= */}
      <section className="dashboard-filter-section" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>
            <Calendar size={18} className="text-primary-color" />
            <span>Filter Analitik:</span>
          </div>

          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px'
          }}>
            {[
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Sebelumnya' },
              { id: 'last_3_months', label: '3 Bulan Terakhir' },
              { id: 'custom', label: 'Rentang Khusus' }
            ].map((p) => {
              const isActive = periodFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id)}
                  style={{
                    padding: '7px 14px',
                    border: 'none',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '600',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#4f46e5' : '#64748b',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is active */}
        {periodFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#334155'
              }}
              title="Tanggal Awal"
            />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#334155'
              }}
              title="Tanggal Akhir"
            />
          </div>
        )}

        {/* Active Range Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '12px',
            color: '#475569',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Rentang: {metrics.startDate} s/d {metrics.endDate}
          </span>

          <button
            type="button"
            onClick={() => fetchAnalyticsSummary()}
            title="Segarkan Analitik"
            aria-label="Refresh Analitik"
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <RefreshCw size={15} style={{ animation: analyticsLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </section>

      {/* =========================================================================
          5 SUMMARY KPI STAT CARDS
          ========================================================================= */}
      <section className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Saldo Seluruh Dompet */}
        <div className="stat-card card-primary">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-primary-soft">
              <Wallet size={22} className="text-primary-color" />
            </div>
            <span className="stat-badge badge-neutral">Semua Rekening</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Total Saldo Bersih</span>
            <h2 className="stat-amount">{formatRupiah(metrics.totalBalance)}</h2>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>Likuiditas Aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pemasukan Periode Terpilih */}
        <div className="stat-card card-income">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-success-soft">
              <ArrowUpRight size={22} className="text-success-color" />
            </div>
            <span className="stat-badge badge-success">+{getPeriodLabel()}</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Total Pemasukan</span>
            <h2 className="stat-amount text-success-color">{formatRupiah(metrics.totalIncome)}</h2>
            <div className="stat-trend positive">
              <span>Dari {incomeTxCount} transaksi</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran Periode Terpilih */}
        <div className="stat-card card-expense">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-danger-soft">
              <ArrowDownRight size={22} className="text-danger-color" />
            </div>
            <span className="stat-badge badge-danger">-{getPeriodLabel()}</span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Total Pengeluaran</span>
            <h2 className="stat-amount text-danger-color">{formatRupiah(metrics.totalExpense)}</h2>
            <div className="stat-trend neutral">
              <span>Dari {expenseTxCount} transaksi</span>
            </div>
          </div>
        </div>

        {/* Card 4: Selisih Pemasukan & Pengeluaran (Arus Kas Bersih) */}
        <div className="stat-card card-savings">
          <div className="stat-top">
            <div className="stat-icon-wrapper bg-warning-soft">
              <PiggyBank size={22} className="text-warning-color" />
            </div>
            <span className={`stat-badge ${metrics.savingsRate >= 20 ? 'badge-success' : 'badge-warning'}`}>
              Savings {metrics.savingsRate}%
            </span>
          </div>
          <div className="stat-body">
            <span className="stat-title">Selisih Arus Kas (Net)</span>
            <h2 className="stat-amount" style={{ color: metrics.netSavings >= 0 ? '#10b981' : '#f43f5e' }}>
              {formatRupiah(metrics.netSavings)}
            </h2>
            <div className={`stat-trend ${metrics.netSavings >= 0 ? 'positive' : 'negative'}`}>
              <span>{metrics.netSavings >= 0 ? 'Surplus Finansial' : 'Defisit Pengeluaran'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Sisa Anggaran & Jumlah Anggaran Terlampaui */}
        <div className="stat-card card-budget" style={{ position: 'relative' }}>
          <div className="stat-top">
            <div className="stat-icon-wrapper" style={{ backgroundColor: metrics.exceededBudgetCount > 0 ? '#fef2f2' : '#ecfdf5', color: metrics.exceededBudgetCount > 0 ? '#ef4444' : '#10b981' }}>
              <Target size={22} />
            </div>
            {metrics.exceededBudgetCount > 0 ? (
              <span className="stat-badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <AlertTriangle size={12} />
                <span>{metrics.exceededBudgetCount} Melebihi Batas</span>
              </span>
            ) : (
              <span className="stat-badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle2 size={12} />
                <span>Anggaran Aman</span>
              </span>
            )}
          </div>
          <div className="stat-body">
            <span className="stat-title">Sisa Plafon Anggaran</span>
            <h2 className="stat-amount" style={{ color: metrics.exceededBudgetCount > 0 ? '#ef4444' : '#0f172a' }}>
              {formatRupiah(metrics.remainingBudget)}
            </h2>
            <div className="stat-trend neutral">
              <span>Plafon: {formatRupiah(metrics.totalBudget)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MIDDLE GRID: CHARTS (CASHFLOW & EXPENSE PIE)
          ========================================================================= */}
      <section className="charts-grid" style={{ marginBottom: '24px' }}>
        {/* Cashflow Chart (Monthly vs Daily) */}
        <div className="content-panel cashflow-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Grafik Arus Kas (Pemasukan vs Pengeluaran)</h2>
              <p className="panel-subtitle">Visualisasi komparasi dana masuk, keluar, dan surplus</p>
            </div>
            <span className="period-pill">{getPeriodLabel()}</span>
          </div>
          <CashflowChart />
        </div>

        {/* Expense Category Breakdown Pie Chart */}
        <div className="content-panel pie-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Komposisi Pengeluaran</h2>
              <p className="panel-subtitle">Berdasarkan kategori pengeluaran terbesar</p>
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

      {/* =========================================================================
          CATEGORY ANALYSIS PANEL: Top Expense Categories & Accurate Percentages
          ========================================================================= */}
      <section className="content-panel category-analysis-panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Analisis Kategori Pengeluaran Terbesar</h2>
            <p className="panel-subtitle">Evaluasi distribusi beban pengeluaran pada {getPeriodLabel().toLowerCase()}</p>
          </div>
          <button 
            className="btn-secondary btn-sm"
            onClick={() => setActivePage('budgets')}
          >
            Kelola Anggaran
          </button>
        </div>

        {(metrics.expenseCategoryData || []).filter(c => c.spent > 0).length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <Layers size={36} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: '600', color: '#475569', fontSize: '15px' }}>
              Belum ada transaksi pengeluaran pada periode ini
            </p>
            <span style={{ fontSize: '13px' }}>
              Gunakan tombol "+ Catat Transaksi" untuk memasukkan catatan mutasi belanja atau tagihan Anda.
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {metrics.expenseCategoryData.filter(c => c.spent > 0).slice(0, 6).map((cat) => {
              const IconComp = iconLookup[cat.icon] || MoreHorizontal;
              return (
                <div key={cat.id} style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: cat.bg || `${cat.color}20`,
                        color: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComp size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{cat.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {cat.budget > 0 ? `Batas: ${formatRupiah(cat.budget)}` : 'Tanpa batas'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#ef4444' }}>
                        {formatRupiah(cat.spent)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1' }}>
                        {cat.percentage}% dari total
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Percentage of Total Expenses */}
                  <div style={{ width: '100%', height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      height: '100%',
                      backgroundColor: cat.color,
                      borderRadius: '4px'
                    }} />
                  </div>

                  {cat.isExceeded && (
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: '#ef4444',
                      fontWeight: '600'
                    }}>
                      <AlertTriangle size={13} />
                      <span>Melebihi anggaran sebesar {formatRupiah(cat.exceededBy)}!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          BOTTOM GRID: RECENT TRANSACTIONS & WALLETS
          ========================================================================= */}
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
            {(wallets || []).map((wallet) => (
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
              <span className="tip-pill">Evaluasi FinTrack</span>
            </div>
            <p className="tip-text">
              Target rasio tabungan ideal adalah minimal <strong>20%</strong> dari pemasukan.
              Rasio tabungan Anda pada {getPeriodLabel().toLowerCase()} adalah <strong>{metrics.savingsRate}%</strong>.
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
