import React, { useState } from 'react';
import { Wallet, LogIn, UserPlus, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function AuthPage() {
  const { login, register, authError, authLoading } = useFinance();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Email dan password wajib diisi.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setLocalError('Nama lengkap wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setLocalError(err.message || 'Terjadi kesalahan saat memproses otentikasi.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setLocalError('');
    try {
      // Coba login dengan akun demo
      await login('apitest@fintrack.test', 'password123');
    } catch {
      // Jika akun demo belum ada, daftarkan
      try {
        await register('Demo User', 'apitest@fintrack.test', 'password123');
      } catch (err) {
        setLocalError(err.message);
      }
    }
  };

  const displayError = localError || authError;

  return (
    <div className="auth-page-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        padding: '36px 32px',
        position: 'relative'
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
            marginBottom: '14px'
          }}>
            <Wallet size={30} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
            FinTrack
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {mode === 'login' ? 'Masuk ke sistem keuangan pribadi Anda' : 'Buat akun baru untuk mulai melacak keuangan'}
          </p>
        </div>

        {/* Tab Toggle Login / Register */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setLocalError(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '9px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#4f46e5' : '#64748b',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setLocalError(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '9px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? '#4f46e5' : '#64748b',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Daftar
          </button>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form Auth */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Nama Lengkap
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Alamat Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              marginTop: '8px',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: authLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              opacity: authLoading ? 0.7 : 1
            }}
          >
            {authLoading ? (
              <span>Memproses...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Masuk Sekarang</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Daftar Akun Baru</span>
              </>
            )}
          </button>
        </form>

        {/* Divider & Quick Demo Button */}
        <div style={{ margin: '24px 0 16px', position: 'relative', textAlign: 'center' }}>
          <div style={{ height: '1px', backgroundColor: '#e2e8f0', width: '100%' }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            padding: '0 12px',
            fontSize: '12px',
            color: '#94a3b8',
            fontWeight: '600'
          }}>
            ATAU
          </span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          disabled={authLoading}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '12px',
            border: '1px dashed #6366f1',
            backgroundColor: '#f5f3ff',
            color: '#4f46e5',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>Masuk Cepat dengan Akun Demo</span>
          <ArrowRight size={15} />
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '20px', marginBottom: 0 }}>
          FinTrack Keuangan Pribadi • Data Terenkripsi & Terisolasi
        </p>
      </div>
    </div>
  );
}
