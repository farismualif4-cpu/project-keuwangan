import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function TransactionModal() {
  const { isAddModalOpen, setIsAddModalOpen, categories, wallets, addTransaction, formatRupiah } = useFinance();

  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [walletId, setWalletId] = useState(() => (wallets && wallets[0]?.id) || 'bca');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (wallets && wallets.length > 0 && !wallets.some((w) => w.id === walletId)) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  if (!isAddModalOpen) return null;

  const currentCategoryList = type === 'expense' ? categories.expense : categories.income;

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(newType === 'expense' ? 'food' : 'salary');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul transaksi wajib diisi');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    addTransaction({
      title: title.trim(),
      amount: numAmount,
      type,
      categoryId,
      walletId,
      date,
      notes: notes.trim()
    });

    // Reset & close
    setTitle('');
    setAmount('');
    setNotes('');
    setError('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Tambah Transaksi Baru</h2>
            <p className="modal-subtitle">Catat mutasi keuangan harian Anda</p>
          </div>
          <button 
            className="modal-close-btn"
            onClick={() => setIsAddModalOpen(false)}
            aria-label="Tutup Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="type-toggle-container">
          <button
            type="button"
            className={`type-tab-btn ${type === 'expense' ? 'active expense' : ''}`}
            onClick={() => handleTypeChange('expense')}
          >
            <ArrowDownRight size={18} />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            className={`type-tab-btn ${type === 'income' ? 'active income' : ''}`}
            onClick={() => handleTypeChange('income')}
          >
            <ArrowUpRight size={18} />
            <span>Pemasukan</span>
          </button>
        </div>

        {error && (
          <div className="form-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Judul */}
          <div className="form-group">
            <label className="form-label">Keterangan / Judul Transaksi</label>
            <input
              type="text"
              placeholder={type === 'expense' ? 'Contoh: Makan Siang, Bensin, Netflix' : 'Contoh: Gaji Kantor, Bonus, Freelance'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              autoFocus
              required
            />
          </div>

          {/* Nominal */}
          <div className="form-group">
            <div className="label-with-preview">
              <label className="form-label">Nominal (Rupiah)</label>
              {amount && !isNaN(amount) && Number(amount) > 0 && (
                <span className="amount-preview-tag">{formatRupiah(amount)}</span>
              )}
            </div>
            <div className="input-prefix-box">
              <span className="input-prefix">Rp</span>
              <input
                type="number"
                placeholder="0"
                min="1"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input with-prefix"
                required
              />
            </div>
          </div>

          {/* Kategori & Dompet Grid */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="form-select"
              >
                {currentCategoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sumber Dana / Dompet</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="form-select"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal */}
          <div className="form-group">
            <label className="form-label">Tanggal Transaksi</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Catatan Tambahan */}
          <div className="form-group">
            <label className="form-label">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              placeholder="Detail kwitansi, nomor referensi, dll..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`btn-primary ${type === 'expense' ? 'btn-expense' : 'btn-income'}`}
            >
              <Check size={18} />
              <span>Simpan {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
