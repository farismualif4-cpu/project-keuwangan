import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { ShoppingBag, Utensils, Car, Zap, Film, HeartPulse, GraduationCap, Briefcase, Laptop, Gift, MoreHorizontal, PieChart as PieIcon, AlertTriangle } from 'lucide-react';

const iconMap = {
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

const PieTooltip = ({ active, payload, formatRupiah }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip-box">
        <p className="tooltip-title">{data.name}</p>
        <p className="tooltip-value" style={{ color: '#f43f5e', margin: '4px 0' }}>{formatRupiah(data.spent)}</p>
        <p className="tooltip-sub">{data.percentage}% dari total pengeluaran</p>
        {data.budget > 0 && (
          <p style={{ fontSize: '11px', color: data.isExceeded ? '#ef4444' : '#10b981', marginTop: '4px' }}>
            {data.isExceeded ? `⚠️ Melebihi anggaran (${formatRupiah(data.budget)})` : `Batas anggaran: ${formatRupiah(data.budget)}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ExpensePieChart() {
  const { metrics, formatRupiah } = useFinance();
  const rawData = (metrics.expenseCategoryData || []).filter((item) => item.spent > 0);

  if (rawData.length === 0) {
    return (
      <div className="chart-empty-state" style={{
        padding: '36px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          color: '#94a3b8'
        }}>
          <PieIcon size={26} />
        </div>
        <p style={{ fontWeight: '600', color: '#475569', fontSize: '14px', margin: '0 0 4px' }}>
          Belum ada pengeluaran pada periode ini
        </p>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          Diagram donat komposisi akan muncul otomatis setelah Anda mencatat pengeluaran.
        </span>
      </div>
    );
  }

  return (
    <div className="donut-chart-container">
      <div style={{ width: '100%', height: 210, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<PieTooltip formatRupiah={formatRupiah} />} />
            <Pie
              data={rawData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={3}
              dataKey="spent"
            >
              {rawData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>
            Total Beban
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
            {formatRupiah(metrics.totalExpense)}
          </div>
        </div>
      </div>

      <div className="donut-legend-list" style={{ marginTop: '8px' }}>
        {rawData.slice(0, 5).map((item) => {
          const IconComp = iconMap[item.icon] || MoreHorizontal;
          return (
            <div key={item.id} className="donut-legend-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
              <div className="legend-row-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cat-color-dot" style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                <span className="cat-legend-name" style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{item.name}</span>
                {item.isExceeded && (
                  <span title="Melebihi Anggaran" style={{ display: 'inline-flex', alignItems: 'center', color: '#ef4444' }}>
                    <AlertTriangle size={13} />
                  </span>
                )}
              </div>
              <div className="legend-row-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cat-legend-pct" style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', padding: '2px 6px', borderRadius: '6px' }}>
                  {item.percentage}%
                </span>
                <span className="cat-legend-amount" style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                  {formatRupiah(item.spent)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
