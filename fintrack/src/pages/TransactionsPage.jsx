import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  AlertCircle,
  FolderPlus,
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

export default function TransactionsPage() {
  const {
    wallets,
    categories,
    allCategories,
    addCategory,
    deleteCategory,
    deleteTransaction,
    updateTransaction,
    setIsAddModalOpen,
    formatRupiah,
    formatShortDate,
    fetchFilteredTransactions,
    refreshTransactions
  } = useFinance();

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Category Management Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [catActionError, setCatActionError] = useState('');
  const [catActionSuccess, setCatActionSuccess] = useState('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('expense');
  const [editCategory, setEditCategory] = useState('');
  const [editWallet, setEditWallet] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Category List for Dropdown
  const activeCategoryList = useMemo(() => {
    if (typeFilter === 'income') return categories.income || [];
    if (typeFilter === 'expense') return categories.expense || [];
    return allCategories || [];
  }, [typeFilter, categories, allCategories]);

  // Fetch Transactions with Server-side Filters and Pagination
  const loadTransactionsData = useCallback(async () => {
    setIsLoadingList(true);
    setFetchError('');

    // Validasi range tanggal jika keduanya diisi
    if (startDate && endDate && startDate > endDate) {
      setFetchError('Tanggal awal tidak boleh melebihi tanggal akhir.');
      setIsLoadingList(false);
      return;
    }

    try {
      const params = {
        page,
        limit,
        type: typeFilter,
        category: selectedCategory,
        wallet: selectedWallet,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined
      };

      const result = await fetchFilteredTransactions(params);
      setDisplayedTransactions(result.data || []);
      if (result.pagination) {
        setTotalRecords(result.pagination.total ?? 0);
        setTotalPages(result.pagination.totalPages ?? 1);
      }
    } catch (err) {
      console.error('[TransactionsPage] Error loading transactions:', err);
      setFetchError(err.message || 'Gagal memuat data transaksi dari server.');
    } finally {
      setIsLoadingList(false);
    }
  }, [fetchFilteredTransactions, page, limit, typeFilter, selectedCategory, selectedWallet, startDate, endDate, search]);

  // Muat transaksi saat filter atau halaman berubah
  useEffect(() => {
    loadTransactionsData();
  }, [loadTransactionsData]);

  // Reset page ke 1 jika filter utama diubah
  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const handleResetFilter = () => {
    setSearch('');
    setTypeFilter('all');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setFetchError('');
  };

  const getCategoryMeta = (catId, type) => {
    const list = type === 'income' ? categories.income : categories.expense;
    const found = (list || []).find((c) => c.id === catId);
    if (found) return found;
    const foundAll = (allCategories || []).find((c) => c.id === catId);
    if (foundAll) return foundAll;
    return { name: 'Umum', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: 'MoreHorizontal' };
  };

  const getWalletMeta = (wId) => {
    return (wallets || []).find((w) => w.id === wId) || { name: 'Dompet' };
  };

  const handleDelete = async (tx) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${tx.title}" secara permanen dari database?`)) {
      try {
        await deleteTransaction(tx.id);
        await loadTransactionsData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus transaksi.');
      }
    }
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditTitle(tx.title);
    setEditAmount(tx.amount.toString());
    setEditType(tx.type);
    setEditCategory(tx.categoryId || tx.category || 'food');
    setEditWallet(tx.walletId || tx.wallet || 'cash');
    setEditDate(tx.date ? tx.date.split('T')[0] : '');
    setEditNotes(tx.notes || tx.description || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTx) return;

    const numAmount = parseFloat(editAmount);
    if (!numAmount || numAmount <= 0) {
      alert('Nominal harus lebih besar dari 0');
      return;
    }

    try {
      await updateTransaction(editingTx.id, {
        title: editTitle.trim(),
        amount: numAmount,
        type: editType,
        categoryId: editCategory,
        walletId: editWallet,
        date: editDate,
        notes: editNotes.trim()
      });
      setEditingTx(null);
      await loadTransactionsData();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui transaksi.');
    }
  };

  // Handler Tambah Kategori Kustom
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatActionError('');
    setCatActionSuccess('');

    if (!newCatName || newCatName.trim().length < 2) {
      setCatActionError('Nama kategori wajib diisi minimal 2 karakter.');
      return;
    }

    setIsSubmittingCat(true);
    try {
      await addCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
        icon: 'Tag'
      });
      setCatActionSuccess(`Kategori "${newCatName.trim()}" berhasil ditambahkan.`);
      setNewCatName('');
    } catch (err) {
      setCatActionError(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Handler Hapus Kategori Kustom
  const handleDeleteCategory = async (cat) => {
    if (cat.isSystem) {
      alert('Kategori sistem bawaan dilindungi dan tidak dapat dihapus.');
      return;
    }
    if (window.confirm(`Hapus kategori kustom "${cat.name}"?`)) {
      setCatActionError('');
      setCatActionSuccess('');
      try {
        await deleteCategory(cat.id);
        setCatActionSuccess(`Kategori "${cat.name}" berhasil dihapus.`);
        if (selectedCategory === cat.id) {
          setSelectedCategory('all');
        }
      } catch (err) {
        setCatActionError(err.message || 'Gagal menghapus kategori.');
      }
    }
  };

  return (
    <div className="transactions-page">
      {/* Filter and Search Bar Card */}
      <div className="content-panel filter-panel">
        <div className="filter-controls-advanced">
          {/* Row 1: Search, Type, Category, Wallet */}
          <div className="filter-row-top">
            {/* Search Bar */}
            <div className="search-box-wrapper" style={{ flex: '1 1 240px' }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Cari judul atau catatan..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="search-input"
              />
              {search && (
                <button className="clear-search-btn" onClick={() => handleFilterChange(setSearch, '')}>✕</button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="type-filter-group">
              <button
                className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange(setTypeFilter, 'all')}
              >
                Semua
              </button>
              <button
                className={`filter-btn ${typeFilter === 'income' ? 'active income' : ''}`}
                onClick={() => handleFilterChange(setTypeFilter, 'income')}
              >
                Pemasukan
              </button>
              <button
                className={`filter-btn ${typeFilter === 'expense' ? 'active expense' : ''}`}
                onClick={() => handleFilterChange(setTypeFilter, 'expense')}
              >
                Pengeluaran
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="filter-select-wrapper">
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange(setSelectedCategory, e.target.value)}
                className="form-select select-sm"
              >
                <option value="all">Semua Kategori</option>
                {activeCategoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'income' ? 'Masuk' : 'Keluar'})
                  </option>
                ))}
              </select>
            </div>

            {/* Wallet Dropdown */}
            <div className="filter-select-wrapper">
              <select
                value={selectedWallet}
                onChange={(e) => handleFilterChange(setSelectedWallet, e.target.value)}
                className="form-select select-sm"
              >
                <option value="all">Semua Dompet</option>
                {(wallets || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date Range, Reset, Kelola Kategori */}
          <div className="filter-row-bottom">
            <div className="date-range-filter-group">
              <Calendar size={16} className="text-muted" />
              <span className="date-filter-label">Rentang:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                className="date-filter-input"
                title="Tanggal Awal"
              />
              <span className="text-muted" style={{ fontSize: '13px' }}>s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                className="date-filter-input"
                title="Tanggal Akhir"
              />
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {(search || typeFilter !== 'all' || selectedCategory !== 'all' || selectedWallet !== 'all' || startDate || endDate) && (
                <button
                  className="btn-secondary btn-sm"
                  onClick={handleResetFilter}
                  title="Reset seluruh filter"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setCatActionError('');
                  setCatActionSuccess('');
                  setIsCatModalOpen(true);
                }}
                title="Kelola Kategori Kustom"
              >
                <Tag size={14} /> Kelola Kategori
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner jika ada */}
      {fetchError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          color: '#e11d48',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Transactions Table & List Panel */}
      <div className="content-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              Daftar Transaksi ({totalRecords})
            </h2>
            <p className="panel-subtitle">
              Menampilkan transaksi yang tersimpan di database dengan paginasi
            </p>
          </div>

          <button
            className="btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> + Transaksi Baru
          </button>
        </div>

        {isLoadingList ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
            <p>Memuat data transaksi dari server...</p>
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="empty-tx-box">
            <Layers size={40} className="text-muted" />
            <p>Tidak ada transaksi yang cocok dengan filter yang dipilih.</p>
            <button
              className="btn-secondary btn-sm"
              onClick={handleResetFilter}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="tx-table-container">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Transaksi</th>
                  <th>Kategori</th>
                  <th>Dompet</th>
                  <th>Catatan</th>
                  <th className="text-right">Nominal</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((tx) => {
                  const cat = getCategoryMeta(tx.categoryId || tx.category, tx.type);
                  const wallet = getWalletMeta(tx.walletId || tx.wallet);
                  const IconComp = iconLookup[cat.icon] || Tag;
                  const isInc = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="tx-row">
                      <td className="tx-col-date">
                        <span className="date-badge">{formatShortDate(tx.date)}</span>
                      </td>
                      <td className="tx-col-title">
                        <div className="title-with-icon">
                          <div
                            className="tx-mini-icon"
                            style={{ backgroundColor: cat.bg, color: cat.color }}
                          >
                            <IconComp size={16} />
                          </div>
                          <span className="font-semibold">{tx.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cat-pill" style={{ color: cat.color, backgroundColor: cat.bg }}>
                          {cat.name}
                        </span>
                      </td>
                      <td>
                        <span className="wallet-pill">{wallet.name}</span>
                      </td>
                      <td className="tx-col-notes">
                        <span className="notes-text">{tx.notes || tx.description || '-'}</span>
                      </td>
                      <td className="text-right tx-col-amount">
                        <span className={`amount-tag ${isInc ? 'text-income' : 'text-expense'}`}>
                          {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn-edit-limit"
                            style={{ padding: '6px', borderRadius: '6px' }}
                            onClick={() => handleOpenEdit(tx)}
                            title="Edit transaksi"
                            aria-label="Edit transaksi"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-delete-row"
                            onClick={() => handleDelete(tx)}
                            title="Hapus transaksi"
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginasi Controls */}
        {!isLoadingList && totalRecords > 0 && (
          <div className="pagination-footer">
            <div className="pagination-meta">
              Halaman {page} dari {totalPages} &bull; Menampilkan {displayedTransactions.length} dari total {totalRecords} data
            </div>

            <div className="pagination-nav">
              <button
                className="pagination-nav-btn"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>

              <div className="pagination-pages-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span style={{ padding: '4px', color: '#94a3b8' }}>...</span>
                      )}
                      <button
                        className={`pagination-page-item ${p === page ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                className="pagination-nav-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Berikutnya <ChevronRight size={16} />
              </button>
            </div>

            <div className="limit-select-group">
              <span>Per Halaman:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="form-select select-sm"
                style={{ width: 'auto' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal Kelola Kategori Dinamis */}
      {isCatModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCatModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Kelola Kategori Finansial</h2>
                <p className="modal-subtitle">Tambah kategori kustom atau tinjau kategori sistem</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsCatModalOpen(false)}
                aria-label="Tutup Modal"
              >
                <X size={20} />
              </button>
            </div>

            {catActionError && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                {catActionError}
              </div>
            )}

            {catActionSuccess && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#059669',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                {catActionSuccess}
              </div>
            )}

            {/* Form Buat Kategori Kustom */}
            <form onSubmit={handleCreateCategory} style={{ marginTop: '16px' }}>
              <div style={{
                padding: '14px',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  + Buat Kategori Kustom Baru
                </h4>
                <div className="form-row-2">
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">Nama Kategori</label>
                    <input
                      type="text"
                      placeholder="Misal: Langganan SaaS"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">Tipe</label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                      className="form-select"
                    >
                      <option value="expense">Pengeluaran (Expense)</option>
                      <option value="income">Pemasukan (Income)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Warna:</label>
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      style={{ width: '36px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary btn-sm"
                    disabled={isSubmittingCat}
                  >
                    <FolderPlus size={15} />
                    <span>{isSubmittingCat ? 'Menyimpan...' : 'Tambah Kategori'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Daftar Kategori Pengguna & Sistem */}
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(allCategories || []).map((cat) => (
                <div key={cat.id} className="cat-manage-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: cat.color || '#64748b'
                    }} />
                    <span style={{ fontWeight: 500, fontSize: '14px', color: '#1e293b' }}>
                      {cat.name}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: cat.type === 'income' ? '#ecfdf5' : '#fff1f2',
                      color: cat.type === 'income' ? '#059669' : '#e11d48'
                    }}>
                      {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cat.isSystem ? (
                      <span className="cat-system-badge">Sistem</span>
                    ) : (
                      <button
                        className="btn-delete-row"
                        style={{ padding: '4px 6px' }}
                        onClick={() => handleDeleteCategory(cat)}
                        title="Hapus kategori kustom"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsCatModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi */}
      {editingTx && (
        <div className="modal-backdrop" onClick={() => setEditingTx(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit Transaksi</h2>
                <p className="modal-subtitle">Perbarui data mutasi keuangan di database</p>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setEditingTx(null)}
                aria-label="Tutup Modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Keterangan / Judul Transaksi</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nominal (Rupiah)</label>
                <input
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="form-select"
                  >
                    {(editType === 'expense' ? categories.expense : categories.income).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dompet / Rekening</label>
                  <select
                    value={editWallet}
                    onChange={(e) => setEditWallet(e.target.value)}
                    className="form-select"
                  >
                    {(wallets || []).map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingTx(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <Check size={18} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
