import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Wallet, Building2, Landmark, Banknote, Smartphone, TrendingUp, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const WALLET_TYPES = [
  { value: 'Bank', label: 'Bank', icon: Building2 },
  { value: 'Cash', label: 'Tunai (Cash)', icon: Banknote },
  { value: 'e-Wallet', label: 'e-Wallet (GoPay/OVO/Dana)', icon: Smartphone },
  { value: 'Investasi', label: 'Investasi / Saham', icon: TrendingUp },
];

const PRESET_COLORS = ['#0060af', '#002554', '#10b981', '#00aed6', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

export default function WalletModal({ isOpen, onClose }) {
  const { wallets, addWallet, updateWallet, deleteWallet, formatRupiah } = useFinance();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setName('');
    setType('Bank');
    setInitialBalance('0');
    setColor('#6366f1');
    setError('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (w) => {
    setName(w.name);
    setType(w.type);
    setInitialBalance(String(w.initialBalance ?? 0));
    setColor(w.color || '#6366f1');
    setError('');
    setIsAdding(false);
    setEditingId(w.id);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama dompet wajib diisi.');
      return;
    }

    const numBal = parseFloat(initialBalance);
    if (isNaN(numBal) || numBal < 0) {
      setError('Saldo awal harus berupa angka non-negatif.');
      return;
    }

    setLoading(true);
    try {
      if (isAdding) {
        await addWallet({
          name: name.trim(),
          type,
          initialBalance: numBal,
          color,
          icon: type === 'Bank' ? 'Building2' : type === 'Cash' ? 'Banknote' : type === 'e-Wallet' ? 'Smartphone' : 'TrendingUp'
        });
      } else if (editingId) {
        await updateWallet(editingId, {
          name: name.trim(),
          type,
          initialBalance: numBal,
          color
        });
      }
      handleCancelForm();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data dompet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, walletName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dompet "${walletName}"?`)) {
      return;
    }
    setError('');
    try {
      await deleteWallet(id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Kelola Dompet & Rekening</h2>
            <p className="modal-subtitle">Atur sumber dana dan rekening keuangan Anda</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="form-error-alert" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingId) ? (
          <form onSubmit={handleSubmit} style={{ background: 'var(--surface-color, #f8fafc)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-main, #0f172a)' }}>
              {isAdding ? 'Tambah Dompet Baru' : 'Ubah Data Dompet'}
            </h3>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Nama Dompet / Bank</label>
              <input
                type="text"
                placeholder="misal: Bank Jago, Dompet Tunai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-row-2" style={{ marginBottom: '12px' }}>
              <div className="form-group">
                <label className="form-label">Tipe Dompet</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="form-select">
                  {WALLET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Warna Label</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid #0f172a' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary btn-sm" onClick={handleCancelForm} disabled={loading}>
                Batal
              </button>
              <button type="submit" className="btn-primary btn-sm" disabled={loading}>
                {loading ? 'Menyimpan...' : (isAdding ? 'Simpan Dompet' : 'Perbarui')}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary btn-sm" onClick={handleStartAdd}>
              <Plus size={16} /> Tambah Dompet Baru
            </button>
          </div>
        )}

        {/* Existing Wallets List */}
        <div className="wallets-management-list" style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {wallets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
              <Wallet size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>Belum ada dompet tersimpan di akun Anda.</p>
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  backgroundColor: 'var(--surface-color, #ffffff)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '36px', borderRadius: '4px', backgroundColor: w.color || '#6366f1' }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main, #0f172a)' }}>
                      {w.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                      {w.type} • Saldo Awal: {formatRupiah(w.initialBalance ?? 0)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main, #0f172a)' }}>
                      {formatRupiah(w.balance ?? w.currentBalance ?? 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>Saldo Aktif</div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={() => handleStartEdit(w)}
                      title="Ubah Dompet"
                      style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={() => handleDelete(w.id, w.name)}
                      title="Hapus Dompet"
                      style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
