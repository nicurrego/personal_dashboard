'use client';

import { KPIMetrics } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/d3-utils';

function KPICard({ label, value, subtext, trend, trendValue }: { 
  label: string; 
  value: string; 
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-5">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-white">{value}</p>
        
        {trend && (
          <span className={`ml-2 flex items-baseline text-xs font-semibold ${
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'}
            {trendValue}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}

interface KPICardsProps {
  metrics: KPIMetrics;
}

export default function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard 
        label="Total Spent" 
        value={formatCurrency(metrics.totalSpent)}
        subtext={`${metrics.totalTransactions} transactions`}
      />
      
      <KPICard 
        label="Monthly Average" 
        value={formatCurrency(metrics.avgMonthly)}
        subtext="Based on available data"
        trend={metrics.monthOverMonth > 0 ? 'up' : 'down'}
        trendValue={`${formatPercentage(Math.abs(metrics.monthOverMonth))} vs prev`}
      />
      
      <KPICard 
        label="Top Category" 
        value={metrics.topCategory}
        subtext="Highest spending area"
      />
      
      <KPICard 
        label="Future Investment" 
        value={formatPercentage(metrics.futurePercentage)}
        subtext="Target: 20%"
        trend={metrics.futurePercentage >= 20 ? 'up' : metrics.futurePercentage >= 10 ? 'neutral' : 'down'}
      />
    </div>
  );
}
