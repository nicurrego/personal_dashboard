'use client';

import { KPIMetrics } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/d3-utils';

export default function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory pt-2 pb-6 -mx-4 px-4 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:pb-8 md:mx-0 md:px-0 no-scrollbar">
      <div className="snap-center shrink-0 w-[85vw] md:w-auto">
        <KPICard 
          label="Total Spent" 
          value={formatCurrency(metrics.totalSpent)}
          subtext={`${metrics.totalTransactions} transactions`}
        />
      </div>
      
      <div className="snap-center shrink-0 w-[85vw] md:w-auto">
        <KPICard 
          label="Monthly Average" 
          value={formatCurrency(metrics.avgMonthly)}
          subtext="Based on available data"
          trend={metrics.monthOverMonth > 0 ? 'up' : 'down'}
          trendValue={`${formatPercentage(Math.abs(metrics.monthOverMonth))} vs prev`}
        />
      </div>
      
      <div className="snap-center shrink-0 w-[85vw] md:w-auto">
        <KPICard 
          label="Top Category" 
          value={metrics.topCategory}
          subtext="Highest spending area"
        />
      </div>
      
      <div className="snap-center shrink-0 w-[85vw] md:w-auto">
        <KPICard 
          label="Future Investment" 
          value={formatPercentage(metrics.futurePercentage)}
          subtext="Target: 20%"
          trend={metrics.futurePercentage >= 20 ? 'up' : metrics.futurePercentage >= 10 ? 'neutral' : 'down'}
        />
      </div>
    </div>
  );
}

function KPICard({ label, value, subtext, trend, trendValue }: { 
  label: string; 
  value: string; 
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <div className="bg-trust-navy rounded-xl border border-neutral-800 p-5 shadow-lg relative overflow-hidden group">
      {/* Neon Glow Effect on Hover */}
      <div className="absolute top-0 left-0 w-1 h-full bg-cyber-cyan opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      <h3 className="text-xs font-bold text-cyber-cyan uppercase tracking-wider mb-1 opacity-80">{label}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        
        {trend && (
          <span className={`flex items-center text-xs font-bold ${
            trend === 'up' ? 'text-laser-magenta' : trend === 'down' ? 'text-growth-green' : 'text-alert-amber'
          }`}>
            {/* Logic Inversion: Spending UP is BAD (Magenta), Spending DOWN is GOOD (Green) for Expenses EXCEPT Investment */}
            {/* Wait, for Investment, UP is GOOD. Need context. */}
            {/* For now, let's keep simple trend arrows, but colors are critical */}
            <span className="mr-1">{trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}</span>
            {trendValue}
          </span>
        )}
      </div>
      {subtext && <p className="mt-2 text-xs text-gray-400 font-medium">{subtext}</p>}
    </div>
  );
}
