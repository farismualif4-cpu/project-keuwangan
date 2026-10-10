import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TransactionModal from './components/TransactionModal';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import BudgetPage from './pages/BudgetPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';

function AppContent() {
  const { activePage, isAuthenticated, authLoading } = useFinance();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Layar loading saat validasi token
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '4px solid rgba(99, 102, 241, 0.2)',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'fintrackSpin 0.9s linear infinite',
          marginBottom: '16px'
        }} />
        <style>{`@keyframes fintrackSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '16px', fontWeight: '600' }}>FinTrack</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Memverifikasi sesi keamanan...</div>
      </div>
    );
  }

  // Tampilkan AuthPage jika belum login
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'budgets':
        return <BudgetPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="app-main-viewport">
        <Header onOpenMobile={() => setMobileSidebarOpen(true)} />
        
        <main className="page-container">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Transaction Modal */}
      <TransactionModal />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}