'use client';

import { KPIMetrics } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/d3-utils';

interface KPICardsProps {
  metrics: KPIMetrics;
}

export default function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory pt-2 pb-6 -mx-4 px-4 gap-3 md:gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 md:px-0 md:mx-0 no-scrollbar">
      {/* Cards - Mobile width optimized to show peek of next card */}
      <div className="snap-center shrink-0 w-[280px] md:w-auto h-full">
        <KPICard
          label="Total Spent"
          value={formatCurrency(metrics.totalTransactions > 0 ? metrics.totalSpent : 0)}
          subtext={`${metrics.totalTransactions} transactions`}
          accent="total"
        />
      </div>

      <div className="snap-center shrink-0 w-[280px] md:w-auto h-full">
        <KPICard
          label="Monthly Average"
          value={formatCurrency(metrics.avgMonthly)}
          subtext="Based on available data"
          trend={metrics.monthOverMonth > 0 ? 'up' : 'down'}
          trendValue={`${formatPercentage(Math.abs(metrics.monthOverMonth))} vs prev`}
          inverseTrend={true} // Up is Bad
          accent="living"
        />
      </div>

      <div className="snap-center shrink-0 w-[280px] md:w-auto h-full">
        <KPICard
          label="Top Category"
          value={metrics.topCategory}
          subtext="Highest spending area"
          accent="present"
        />
      </div>

      <div className="snap-center shrink-0 w-[280px] md:w-auto h-full">
        <KPICard
          label="Future Investment"
          value={formatPercentage(metrics.futurePercentage)}
          subtext="Target: 20%"
          trend={metrics.futurePercentage >= 20 ? 'up' : metrics.futurePercentage >= 10 ? 'neutral' : 'down'}
          accent="future"
        />
      </div>
    </div>
  );
}

function KPICard({ label, value, subtext, trend, trendValue, inverseTrend = false, accent = 'total' }: {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  inverseTrend?: boolean;
  accent?: 'total' | 'future' | 'living' | 'present';
}) {
  // Map accents to Kibo Palette CSS variables
  // total: Teal (#A9D9C7)
  // future: Purple (#614FBB)
  // living: Blue (#65A1C9)
  // present: Red (#C24656)

  const accentColors = {
    total: 'border-l-[var(--color-total)]',
    future: 'border-l-[var(--color-future)]',
    living: 'border-l-[var(--color-living)]',
    present: 'border-l-[var(--color-present)]',
  };

  const trendColors = {
    positive: 'text-[var(--color-total)]', // Good (Teal)
    negative: 'text-[var(--color-present)]', // Bad (Red)
    neutral: 'text-[var(--color-living)]'    // Neutral (Blue)
  };

  let trendColorClass = trendColors.neutral;
  if (trend === 'up') trendColorClass = inverseTrend ? trendColors.negative : trendColors.positive;
  if (trend === 'down') trendColorClass = inverseTrend ? trendColors.positive : trendColors.negative;

  return (
    <div className={`liquid-card p-5 h-full relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] border-l-4 first:ml-0 ${accentColors[accent]} shadow-md bg-[#1B4034]`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#A9D9C7]/70">{label}</h3>
        {trend && (
          <span className={`flex items-center text-[10px] font-mono font-bold ${trendColorClass} bg-black/20 px-1.5 py-0.5 rounded-full`}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-white tracking-tight break-words truncate" title={value}>{value}</p>

      {subtext && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-[#A9D9C7]/50 font-mono uppercase tracking-wider truncate">{subtext}</p>
        </div>
      )}
    </div>
  );
}
