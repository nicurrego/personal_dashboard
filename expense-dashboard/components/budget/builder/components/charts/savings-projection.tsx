'use client';

import type { ChartProps } from './types';
import { formatMoney } from '../../utils/formatters';

export function SavingsProjection({ totals, size, monthlyNetCashFlow = 0 }: ChartProps) {
  const isSmall = size === 'small';
  const containerClass = isSmall ? 'w-full h-full min-h-[5rem]' : 'w-full h-48';
  
  // Calculate 12-month projection
  const netCashFlow = monthlyNetCashFlow || (totals.income - (totals.future + totals.living + totals.present));
  const monthlyData: number[] = [];
  let cumulative = 0;
  
  for (let i = 0; i < 12; i++) {
    cumulative += netCashFlow;
    monthlyData.push(cumulative);
  }
  
  const maxVal = Math.max(...monthlyData.map(Math.abs), 1);
  const minVal = Math.min(...monthlyData, 0);
  const range = maxVal - minVal;
  
  // Normalize to 0-100 scale
  const normalize = (val: number) => ((val - minVal) / range) * 80 + 10;
  
  const isPositive = netCashFlow >= 0;

  if (isSmall) {
    // Mini sparkline version
    const points = monthlyData
      .map((val, i) => `${(i / 11) * 100},${100 - normalize(val)}`)
      .join(' ');
    
    return (
      <div className={`${containerClass} flex items-center justify-center`}>
        <svg viewBox="0 0 100 60" className="w-full h-full">
          {/* Zero line */}
          <line 
            x1="0" y1={100 - normalize(0)} 
            x2="100" y2={100 - normalize(0)} 
            stroke="#334155" 
            strokeWidth="0.5" 
            strokeDasharray="2,2" 
          />
          
          {/* Projection line */}
          <polyline
            points={points}
            fill="none"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End point */}
          <circle 
            cx="100" 
            cy={100 - normalize(monthlyData[11])} 
            r="3" 
            fill={isPositive ? '#22c55e' : '#ef4444'} 
          />
        </svg>
      </div>
    );
  }

  // Full size version
  const points = monthlyData
    .map((val, i) => `${10 + (i / 11) * 180},${90 - normalize(val) * 0.8}`)
    .join(' ');

  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <div className={`${containerClass} relative`}>
      <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line 
            key={y} 
            x1="10" y1={10 + y * 0.7} 
            x2="190" y2={10 + y * 0.7} 
            stroke="#1e293b" 
            strokeWidth="0.5" 
          />
        ))}
        
        {/* Zero line */}
        <line 
          x1="10" y1={90 - normalize(0) * 0.8} 
          x2="190" y2={90 - normalize(0) * 0.8} 
          stroke="#475569" 
          strokeWidth="1" 
          strokeDasharray="4,2" 
        />
        
        {/* Area fill */}
        <path
          d={`M 10,${90 - normalize(0) * 0.8} ${points.split(' ').map((p, i) => (i === 0 ? `L ${p}` : p)).join(' L ')} L 190,${90 - normalize(0) * 0.8} Z`}
          fill={isPositive ? 'url(#greenGradient)' : 'url(#redGradient)'}
          opacity="0.3"
        />
        
        {/* Projection line */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {monthlyData.map((val, i) => (
          <circle 
            key={i}
            cx={10 + (i / 11) * 180} 
            cy={90 - normalize(val) * 0.8} 
            r="2.5" 
            fill={isPositive ? '#22c55e' : '#ef4444'}
            className="opacity-80"
          />
        ))}
        
        {/* Month labels */}
        {months.map((m, i) => (
          <text 
            key={i} 
            x={10 + (i / 11) * 180} 
            y="98" 
            textAnchor="middle" 
            className="fill-slate-500 text-[4px]"
          >
            {m}
          </text>
        ))}
        
        {/* End value label */}
        <text 
          x="190" 
          y={85 - normalize(monthlyData[11]) * 0.8} 
          textAnchor="end" 
          className={`text-[6px] font-bold ${isPositive ? 'fill-[#22c55e]' : 'fill-red-500'}`}
        >
          {formatMoney(monthlyData[11])}
        </text>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
