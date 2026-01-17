'use client';

import type { ChartProps } from './types';
import { CATEGORY_COLORS } from '@/lib/category-colors';

export function DonutChart({ totals, size }: ChartProps) {
  const total = Math.max(totals.future + totals.living + totals.present, 1);
  const futurePercent = Math.round((totals.future / total) * 100);
  const livingPercent = Math.round((totals.living / total) * 100);
  const presentPercent = Math.round((totals.present / total) * 100);

  const r = 16;
  const c = 2 * Math.PI * r;

  const isSmall = size === 'small';
  const containerClass = isSmall ? 'w-24 h-24' : 'w-48 h-48';
  const strokeWidth = isSmall ? 4 : 5;
  const centerTextClass = isSmall ? 'text-[8px]' : 'text-xs';
  const valueTextClass = isSmall ? 'text-xs' : 'text-lg';

  return (
    <div className={`relative ${containerClass}`}>
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        {/* Background Circle */}
        <circle cx="20" cy="20" r={r} fill="transparent" stroke="#1e293b" strokeWidth={strokeWidth} />

        {/* Future Segment (Green) */}
        <circle
          cx="20" cy="20" r={r}
          fill="transparent"
          stroke={CATEGORY_COLORS.FUTURE}
          strokeWidth={strokeWidth}
          strokeDasharray={`${(futurePercent / 100) * c} ${c}`}
          className="transition-all duration-500"
        />

        {/* Living Segment (Cyan) */}
        <circle
          cx="20" cy="20" r={r}
          fill="transparent"
          stroke={CATEGORY_COLORS.LIVING}
          strokeWidth={strokeWidth}
          strokeDasharray={`${(livingPercent / 100) * c} ${c}`}
          strokeDashoffset={-((futurePercent / 100) * c)}
          className="transition-all duration-500"
        />

        {/* Present Segment (Amber) */}
        <circle
          cx="20" cy="20" r={r}
          fill="transparent"
          stroke={CATEGORY_COLORS.PRESENT}
          strokeWidth={strokeWidth}
          strokeDasharray={`${(presentPercent / 100) * c} ${c}`}
          strokeDashoffset={-(((futurePercent + livingPercent) / 100) * c)}
          className="transition-all duration-500"
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center">
          <span className={`${centerTextClass} text-slate-400 font-bold uppercase`}>Alloc</span>
          <span className={`${valueTextClass} font-bold text-white`}>100%</span>
        </div>
      </div>

      {/* Legend for large size */}
      {!isSmall && (
        <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.FUTURE }} />
            <span className="text-slate-400">{futurePercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.LIVING }} />
            <span className="text-slate-400">{livingPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.PRESENT }} />
            <span className="text-slate-400">{presentPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

