import React, { useState } from 'react';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Edit2,
  Check,
  X,
  PlusCircle,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
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
  MoreHorizontal
};

export default function BudgetPage() {
  const { metrics, categories, budgets, updateBudget, formatRupiah } = useFinance();

  const [editingId, setEditingId] = useState(null);
  const [tempLimit, setTempLimit] = useState('');

  const expenseCategories = categories.expense;

  const budgetItems = expenseCategories.map((cat) => {
    const budgetObj = budgets.find((b) => b.categoryId === cat.id);
    const limit = budgetObj ? Number(budgetObj.limit ?? budgetObj.amount ?? 0) : 0;
    const catData = metrics.expenseCategoryData.find((c) => c.id === cat.id);
    const spent = catData ? catData.spent : 0;
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const remaining = limit - spent;

    return {
      ...cat,
      limit,
      spent,
      percent,
      remaining
    };
  });

  const totalBudgeted = budgetItems.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpentInBudgeted = budgetItems.reduce((acc, curr) => acc + curr.spent, 0);
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpentInBudgeted / totalBudgeted) * 100) : 0;

  const handleStartEdit = (catId, currentLimit) => {
    setEditingId(catId);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveEdit = async (catId) => {
    const newLimit = parseFloat(tempLimit);
    if (!isNaN(newLimit) && newLimit >= 0) {
      try {
        await updateBudget(catId, newLimit);
      } catch (err) {
        alert('Gagal menyimpan anggaran ke server: ' + err.message);
      }
    }
    setEditingId(null);
    setTempLimit('');
  };

  return (
    <div className="budget-page">
      {/* Overview Stat Cards */}
      <section className="stats-grid">
        <div className="stat-card card-primary">
          <div className="stat-top">
            <span className="stat-title">Total Alokasi Anggaran</span>
            <Target size={20} className="text-primary-color" />
          </div>
          <h2 className="stat-amount">{formatRupiah(totalBudgeted)}</h2>
          <span className="stat-sub">Batas pengeluaran bulanan yang direncanakan</span>
        </div>

        <div className="stat-card card-expense">
          <div className="stat-top">
            <span className="stat-title">Total Realisasi Terpakai</span>
            <TrendingDown size={20} className="text-danger-color" />
          </div>
          <h2 className="stat-amount text-danger-color">{formatRupiah(totalSpentInBudgeted)}</h2>
          <span className="stat-sub">{overallPercent}% dari total batas yang dialokasikan</span>
        </div>

        <div className="stat-card card-savings">
          <div className="stat-top">
            <span className="stat-title">Sisa Plafon Anggaran</span>
            <CheckCircle2 size={20} className="text-success-color" />
          </div>
          <h2 className="stat-amount text-success-color">
            {formatRupiah(Math.max(totalBudgeted - totalSpentInBudgeted, 0))}
          </h2>
          <span className="stat-sub">
            {totalBudgeted >= totalSpentInBudgeted ? 'Dana masih aman terkendali' : '⚠️ Melebihi plafon anggaran!'}
          </span>
        </div>
      </section>

      {/* Budget Cards List */}
      <div className="content-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Batas Anggaran per Kategori</h2>
            <p className="panel-subtitle">Klik ikon pensil untuk mengatur atau mengubah batas maksimal per kategori</p>
          </div>
        </div>

        <div className="budget-cards-grid">
          {budgetItems.map((item) => {
            const IconComp = iconLookup[item.icon] || MoreHorizontal;
            const isOver = item.percent > 100;
            const isWarning = item.percent >= 80 && !isOver;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={`budget-card ${isOver ? 'over-budget' : ''}`}>
                <div className="budget-card-header">
                  <div className="budget-header-left">
                    <div 
                      className="tx-mini-icon"
                      style={{ backgroundColor: item.bg, color: item.color }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h3 className="budget-item-name">{item.name}</h3>
                      <span className="budget-spent-label">
                        Terpakai: <strong>{formatRupiah(item.spent)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="budget-badge-status">
                    {item.limit === 0 ? (
                      <span className="status-pill status-gray">Belum Diatur</span>
                    ) : isOver ? (
                      <span className="status-pill status-danger">Over Limit {item.percent}%</span>
                    ) : isWarning ? (
                      <span className="status-pill status-warning">Waspada {item.percent}%</span>
                    ) : (
                      <span className="status-pill status-success">Aman {item.percent}%</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-bg" style={{ marginTop: '14px', marginBottom: '10px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(item.percent, 100)}%`,
                      backgroundColor: isOver ? '#ef4444' : isWarning ? '#f59e0b' : item.color
                    }}
                  />
                </div>

                {/* Footer and Edit Limit */}
                <div className="budget-card-footer">
                  {isEditing ? (
                    <div className="edit-limit-inline">
                      <span className="prefix-sm">Rp</span>
                      <input
                        type="number"
                        value={tempLimit}
                        onChange={(e) => setTempLimit(e.target.value)}
                        className="form-input input-sm"
                        autoFocus
                      />
                      <button
                        className="btn-icon-action save"
                        onClick={() => handleSaveEdit(item.id)}
                        title="Simpan"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn-icon-action cancel"
                        onClick={() => setEditingId(null)}
                        title="Batal"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="limit-display-row">
                      <div className="limit-info">
                        <span className="text-muted">Batas: </span>
                        <strong>{item.limit > 0 ? formatRupiah(item.limit) : 'Rp 0'}</strong>
                        {item.limit > 0 && (
                          <span className="remaining-text">
                            (Sisa: {formatRupiah(item.remaining)})
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-edit-limit"
                        onClick={() => handleStartEdit(item.id, item.limit)}
                        title="Ubah Anggaran"
                      >
                        <Edit2 size={15} />
                        <span>Ubah</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
