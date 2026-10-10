import React from 'react';
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
      </div>
    );
  }
  return null;
};

export default function CashflowChart() {
  const { metrics, formatRupiah } = useFinance();
  const data = metrics.trendChartData;

  const formatYAxis = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
    return val;
  };

  return (
    <div className="chart-wrapper">
      <div style={{ width: '100%', height: 280 }}>
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
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={formatYAxis} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
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

      <div className="chart-legend-row">
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
