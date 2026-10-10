import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Settings,
  Wallet,
  Sparkles,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { activePage, setActivePage, metrics, formatRupiah, user, logout } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'reports', label: 'Laporan & Grafik', icon: PieChart },
    { id: 'budgets', label: 'Anggaran', icon: Target },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
      logout();
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'FT';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-badge">
            <div className="logo-icon-box">
              <Wallet size={22} className="logo-svg" />
            </div>
            <div>
              <span className="logo-title">FinTrack</span>
              <span className="logo-sub">Smart Wealth</span>
            </div>
          </div>
          
          <button 
            className="mobile-close-btn" 
            onClick={onCloseMobile}
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Balance Preview in Sidebar */}
        <div className="sidebar-balance-card">
          <div className="balance-label">
            <span>Total Saldo Aktif</span>
            <Sparkles size={14} className="sparkle-icon" />
          </div>
          <div className="balance-value">{formatRupiah(metrics.totalBalance)}</div>
          <div className="balance-sub">
            <span className="tag-positive">
              Tabungan {metrics.savingsRate}%
            </span>
          </div>
        </div>

        {/* Navigations */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">MENU UTAMA</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <Icon size={19} />
                </div>
                <span className="nav-label">{item.label}</span>
                {isActive && <ChevronRight size={16} className="nav-arrow" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'hidden' }}>
            <div className="user-avatar" style={{ flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '12px' }}>
              <span>{userInitials}</span>
            </div>
            <div className="user-info" style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="user-name" style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Pengguna FinTrack'}
              </div>
              <div className="user-status" style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'Personal Plan'}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            title="Keluar dari sesi"
            aria-label="Logout"
            style={{
              flexShrink: 0,
              background: 'rgba(239, 68, 68, 0.12)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
