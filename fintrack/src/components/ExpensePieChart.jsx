import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { ShoppingBag, Utensils, Car, Zap, Film, HeartPulse, GraduationCap, MoreHorizontal } from 'lucide-react';

const iconMap = {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  MoreHorizontal
};

const PieTooltip = ({ active, payload, formatRupiah }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip-box">
        <p className="tooltip-title">{data.name}</p>
        <p className="tooltip-value">{formatRupiah(data.spent)}</p>
        <p className="tooltip-sub">{data.percentage}% dari total pengeluaran</p>
      </div>
    );
  }
  return null;
};

export default function ExpensePieChart() {
  const { metrics, formatRupiah } = useFinance();
  const rawData = metrics.expenseCategoryData.filter((item) => item.spent > 0);

  if (rawData.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>Belum ada data pengeluaran yang tercatat.</p>
        <span>Tambahkan transaksi pengeluaran untuk melihat diagram alokasi.</span>
      </div>
    );
  }

  return (
    <div className="donut-chart-container">
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<PieTooltip formatRupiah={formatRupiah} />} />
            <Pie
              data={rawData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="spent"
            >
              {rawData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="donut-legend-list">
        {rawData.slice(0, 4).map((item) => {
          const IconComp = iconMap[item.icon] || MoreHorizontal;
          return (
            <div key={item.id} className="donut-legend-row">
              <div className="legend-row-left">
                <span className="cat-color-dot" style={{ backgroundColor: item.color }} />
                <span className="cat-legend-name">{item.name}</span>
              </div>
              <div className="legend-row-right">
                <span className="cat-legend-pct">{item.percentage}%</span>
                <span className="cat-legend-amount">{formatRupiah(item.spent)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
