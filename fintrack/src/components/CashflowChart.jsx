import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { Calendar, BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, formatRupiah }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip-box">
        <p className="tooltip-title">{label}</p>
        <div className="tooltip-row text-success">
          <span className="tooltip-dot bg-success" />
          <span>Pemasukan:</span>
          <strong>{formatRupiah(payload[0]?.value || 0)}</strong>
        </div>
        <div className="tooltip-row text-danger">
          <span className="tooltip-dot bg-danger" />
          <span>Pengeluaran:</span>
          <strong>{formatRupiah(payload[1]?.value || 0)}</strong>
        </div>
        {payload[0] && payload[1] && (
          <div className="tooltip-row" style={{ marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
            <span>Net Arus Kas:</span>
            <strong style={{ color: (payload[0].value - payload[1].value) >= 0 ? '#10b981' : '#f43f5e' }}>
              {formatRupiah((payload[0].value || 0) - (payload[1].value || 0))}
            </strong>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function CashflowChart() {
  const { metrics, formatRupiah } = useFinance();
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'daily'

  const isDaily = viewMode === 'daily';
  const data = isDaily ? (metrics.dailyCashflowData || []) : (metrics.trendChartData || []);
  const xKey = isDaily ? 'label' : 'month';

  const formatYAxis = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
    return val;
  };

  return (
    <div className="chart-wrapper">
      {/* View Mode Switcher Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
          <BarChart3 size={16} />
          <span>Tampilan: <strong>{isDaily ? 'Arus Kas Harian (Periode Terpilih)' : 'Tren Bulanan (6 Bulan Terakhir)'}</strong></span>
        </div>

        <div style={{
          display: 'inline-flex',
          backgroundColor: '#f1f5f9',
          padding: '3px',
          borderRadius: '10px'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: !isDaily ? '#ffffff' : 'transparent',
              color: !isDaily ? '#4f46e5' : '#64748b',
              boxShadow: !isDaily ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: isDaily ? '#ffffff' : 'transparent',
              color: isDaily ? '#4f46e5' : '#64748b',
              boxShadow: isDaily ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Harian
          </button>
        </div>
      </div>

      {isDaily && data.length === 0 ? (
        <div style={{
          height: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          textAlign: 'center',
          padding: '20px'
        }}>
          <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Belum ada transaksi harian pada periode ini</p>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Coba ubah filter periode atau catat transaksi baru</span>
        </div>
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                dataKey={xKey} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={formatYAxis} 
                tick={{ fill: '#64748b', fontSize: 11 }} 
              />
              <Tooltip content={<CustomTooltip formatRupiah={formatRupiah} />} />
              <Area
                type="monotone"
                dataKey="income"
                name="Pemasukan"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Pengeluaran"
                stroke="#f43f5e"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="chart-legend-row" style={{ marginTop: '12px' }}>
        <div className="legend-item">
          <span className="legend-badge bg-income-tag" />
          <span>Pemasukan: <strong>{formatRupiah(metrics.totalIncome)}</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-badge bg-expense-tag" />
          <span>Pengeluaran: <strong>{formatRupiah(metrics.totalExpense)}</strong></span>
        </div>
      </div>
    </div>
  );
}
