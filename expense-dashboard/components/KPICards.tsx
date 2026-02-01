'use client';

import { KPIMetrics } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/d3-utils';

interface KPICardsProps {
  metrics: KPIMetrics;
}

export default function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory pt-2 pb-6 -mx-4 px-4 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:pb-8 md:mx-0 md:px-0 no-scrollbar">
      <div className="snap-center shrink-0 w-[85vw] md:w-auto h-full">
        <KPICard
          label="Total Spent"
          value={formatCurrency(metrics.totalTransactions > 0 ? metrics.totalSpent : 0)}
          subtext={`${metrics.totalTransactions} transactions`}
          accent="cobalt"
        />
      </div>

      <div className="snap-center shrink-0 w-[85vw] md:w-auto h-full">
        <KPICard
          label="Monthly Average"
          value={formatCurrency(metrics.avgMonthly)}
          subtext="Based on available data"
          trend={metrics.monthOverMonth > 0 ? 'up' : 'down'}
          trendValue={`${formatPercentage(Math.abs(metrics.monthOverMonth))} vs prev`}
          inverseTrend={true} // Up is Bad
          accent="orange"
        />
      </div>

      <div className="snap-center shrink-0 w-[85vw] md:w-auto h-full">
        <KPICard
          label="Top Category"
          value={metrics.topCategory}
          subtext="Highest spending area"
          accent="cobalt"
        />
      </div>

      <div className="snap-center shrink-0 w-[85vw] md:w-auto h-full">
        <KPICard
          label="Future Investment"
          value={formatPercentage(metrics.futurePercentage)}
          subtext="Target: 20%"
          trend={metrics.futurePercentage >= 20 ? 'up' : metrics.futurePercentage >= 10 ? 'neutral' : 'down'}
          accent="green"
        />
      </div>
    </div>
  );
}

function KPICard({ label, value, subtext, trend, trendValue, inverseTrend = false, accent = 'cobalt' }: {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  inverseTrend?: boolean;
  accent?: 'green' | 'orange' | 'cobalt';
}) {
  // Determine trend color
  let trendColor = 'text-muted-foreground';
  if (trend === 'up') trendColor = inverseTrend ? 'text-[#CC8257]' : 'text-[#8DF2CD]'; // kibo-orange : cat-mint
  if (trend === 'down') trendColor = inverseTrend ? 'text-[#8DF2CD]' : 'text-[#CC8257]'; // cat-mint : kibo-orange
  if (trend === 'neutral') trendColor = 'text-[#6CA1B7]'; // kibo-blue

  const accentClass = accent === 'green' ? 'border-l-[#8DF2CD]' : accent === 'orange' ? 'border-l-[#CC8257]' : 'border-l-[#6CA1B7]';

  return (
    <div className={`liquid-card p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] border-l-4 ${accentClass}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-label text-secondary-text">{label}</h3>
        {trend && (
          <span className={`flex items-center text-xs font-mono font-bold ${trendColor} bg-neutral-900/50 px-2 py-1 rounded-full`}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
          </span>
        )}
      </div>

      <p className="text-value mt-1">{value}</p>

      {subtext && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-secondary-text font-mono uppercase tracking-wider">{subtext}</p>
        </div>
      )}
    </div>
  );
}
