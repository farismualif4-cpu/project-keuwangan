import React from 'react';
import {
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import CashflowChart from '../components/CashflowChart';
import ExpensePieChart from '../components/ExpensePieChart';

export default function ReportsPage() {
  const { metrics, formatRupiah } = useFinance();

  const expenseCategories = metrics.expenseCategoryData;
  const totalExpense = metrics.totalExpense;
  const totalIncome = metrics.totalIncome;

  // 50/30/20 Rule Analysis (Termasuk kategori education)
  const needsCategories = ['food', 'bills', 'transport', 'health', 'education'];
  const wantsCategories = ['shopping', 'entertainment', 'others_exp'];

  let needsSpent = 0;
  let wantsSpent = 0;

  expenseCategories.forEach((cat) => {
    if (needsCategories.includes(cat.id)) {
      needsSpent += cat.spent;
    } else if (wantsCategories.includes(cat.id)) {
      wantsSpent += cat.spent;
    }
  });

  const needsPercent = totalIncome > 0 ? Math.round((needsSpent / totalIncome) * 100) : 0;
  const wantsPercent = totalIncome > 0 ? Math.round((wantsSpent / totalIncome) * 100) : 0;
  const savingsPercent = metrics.savingsRate;

  return (
    <div className="reports-page">
      {/* 3 Metric Cards */}
      <section className="stats-grid">
        <div className="stat-card card-income">
          <div className="stat-top">
            <span className="stat-title">Total Pendapatan</span>
            <ArrowUpRight size={20} className="text-success-color" />
          </div>
          <h2 className="stat-amount text-success-color">{formatRupiah(totalIncome)}</h2>
          <span className="stat-sub">100% dari total arus kas masuk</span>
        </div>

        <div className="stat-card card-expense">
          <div className="stat-top">
            <span className="stat-title">Total Biaya & Beban</span>
            <ArrowDownRight size={20} className="text-danger-color" />
          </div>
          <h2 className="stat-amount text-danger-color">{formatRupiah(totalExpense)}</h2>
          <span className="stat-sub">
            {totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}% dari pendapatan
          </span>
        </div>

        <div className="stat-card card-savings">
          <div className="stat-top">
            <span className="stat-title">Tingkat Tabungan (Savings Rate)</span>
            <Award size={20} className="text-warning-color" />
          </div>
          <h2 className="stat-amount">{savingsPercent}%</h2>
          <span className="stat-sub">
            {savingsPercent >= 20 ? '🎉 Melebihi target ideal 20%' : '⚠️ Di bawah target ideal 20%'}
          </span>
        </div>
      </section>

      {/* 50 / 30 / 20 Budget Rule Health Check */}
      <div className="content-panel rule-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Analisis Rasio Keuangan (Aturan 50 / 30 / 20)</h2>
            <p className="panel-subtitle">Standar alokasi ideal: 50% Kebutuhan Pokok, 30% Keinginan, 20% Tabungan/Investasi</p>
          </div>
        </div>

        <div className="rule-cards-grid">
          {/* Needs */}
          <div className="rule-card">
            <div className="rule-card-top">
              <span className="rule-tag">Kebutuhan Pokok (Target: 50%)</span>
              <span className={`rule-pct ${needsPercent <= 50 ? 'text-success' : 'text-danger'}`}>
                {needsPercent}%
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill bg-info"
                style={{ width: `${Math.min(needsPercent, 100)}%` }}
              />
            </div>
            <div className="rule-card-footer">
              <span>Pengeluaran: {formatRupiah(needsSpent)}</span>
              <span>{needsPercent <= 50 ? '✅ Sesuai Target' : '⚠️ Melebihi Batas'}</span>
            </div>
          </div>

          {/* Wants */}
          <div className="rule-card">
            <div className="rule-card-top">
              <span className="rule-tag">Gaya Hidup & Keinginan (Target: 30%)</span>
              <span className={`rule-pct ${wantsPercent <= 30 ? 'text-success' : 'text-warning'}`}>
                {wantsPercent}%
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill bg-warning"
                style={{ width: `${Math.min(wantsPercent, 100)}%` }}
              />
            </div>
            <div className="rule-card-footer">
              <span>Pengeluaran: {formatRupiah(wantsSpent)}</span>
              <span>{wantsPercent <= 30 ? '✅ Aman' : '⚠️ Perlu Penghematan'}</span>
            </div>
          </div>

          {/* Savings */}
          <div className="rule-card">
            <div className="rule-card-top">
              <span className="rule-tag">Tabungan & Investasi (Target: 20%)</span>
              <span className={`rule-pct ${savingsPercent >= 20 ? 'text-success' : 'text-danger'}`}>
                {savingsPercent}%
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill bg-success"
                style={{ width: `${Math.min(savingsPercent, 100)}%` }}
              />
            </div>
            <div className="rule-card-footer">
              <span>Sisa Tabungan: {formatRupiah(metrics.netSavings)}</span>
              <span>{savingsPercent >= 20 ? '🌟 Sangat Bagus' : '📈 Perlu Ditingkatkan'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <section className="charts-grid">
        <div className="content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Grafik Perbandingan Cashflow</h2>
              <p className="panel-subtitle">Visualisasi pemasukan vs beban operasional</p>
            </div>
          </div>
          <CashflowChart />
        </div>

        <div className="content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Komposisi Pengeluaran</h2>
              <p className="panel-subtitle">Persentase alokasi dana per kategori</p>
            </div>
          </div>
          <ExpensePieChart />
        </div>
      </section>

      {/* Category Breakdown Table */}
      <div className="content-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Rincian Pengeluaran per Kategori</h2>
            <p className="panel-subtitle">Evaluasi setiap pos pengeluaran dari nominal terbesar</p>
          </div>
        </div>

        <div className="category-report-table-wrapper">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th className="text-right">Nominal Pengeluaran</th>
                <th>Kontribusi (%)</th>
                <th>Porsi Visual</th>
              </tr>
            </thead>
            <tbody>
              {expenseCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="title-with-icon">
                      <span className="cat-color-dot" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                  </td>
                  <td className="text-right font-semibold">
                    {formatRupiah(cat.spent)}
                  </td>
                  <td>
                    <span className="pct-badge">{cat.percentage}%</span>
                  </td>
                  <td style={{ width: '35%' }}>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
