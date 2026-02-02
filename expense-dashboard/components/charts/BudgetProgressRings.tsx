'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BudgetProgress } from '@/types';
import { formatCurrency } from '@/lib/d3-utils';

interface BudgetProgressRingsProps {
  progress: BudgetProgress;
}

export default function BudgetProgressRings({ progress }: BudgetProgressRingsProps) {
  return (
    <div className="liquid-card p-6">
      <h2 className="text-sm font-bold text-secondary-text mb-6 uppercase tracking-wider flex items-center justify-between">
        Budget vs Actual
        <span className="text-[10px] bg-white/5 py-1 px-2 rounded-full border border-white/10 font-normal normal-case tracking-normal">
          Monthly Pace
        </span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <RingItem
          label="Total"
          data={progress.total}
          color="var(--color-total)" // Income/Total Teal
        />
        <RingItem
          label="Living"
          data={progress.living}
          color="var(--color-living)" // Living Blue
        />
        <RingItem
          label="Present"
          data={progress.present}
          color="var(--color-present)" // Present Red
        />
        <RingItem
          label="Future"
          data={progress.future}
          color="var(--color-future)" // Future Purple
        />
      </div>
    </div>
  );
}

function RingItem({
  label,
  data,
  color,
}: {
  label: string;
  data: { spent: number; budget: number; remaining: number; percentage: number };
  color: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Guard against NaN or infinite percentages
  const percentage = isFinite(data.percentage) ? data.percentage : 0;
  const isOverBudget = percentage > 100;

  // Determine display color (warning if over 100%)
  const displayColor = percentage > 100 ? 'var(--color-present)' : color;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 120;
    const height = 120;
    const radius = Math.min(width, height) / 2;
    const strokeWidth = 10;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Background Circle (Track)
    g.append('circle')
      .attr('r', radius - strokeWidth / 2)
      .attr('fill', 'none')
      .attr('stroke', '#1B4034') // Darker track
      .attr('stroke-width', strokeWidth)
      .attr('opacity', 0.5);

    // Progress Arc
    const arc = d3.arc()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
      .startAngle(0)
      .cornerRadius(strokeWidth / 2);

    // Animate arc
    const visualPercentage = Math.min(percentage, 100);
    const targetAngle = (visualPercentage / 100) * 2 * Math.PI;

    const foreground = g.append('path')
      .datum({ endAngle: 0 })
      .attr('fill', displayColor)
      .attr('d', arc as any);

    foreground.transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d: any) {
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function (t: any) {
          d.endAngle = interpolate(t);
          return arc(d) || '';
        };
      });

  }, [percentage, displayColor]);

  return (
    <div className="flex flex-col items-center justify-center group">
      {/* Ring Container */}
      <div className="relative w-28 h-28 mb-4 transition-transform duration-300 group-hover:scale-105">
        <svg ref={svgRef} className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-2xl font-bold tracking-tight ${isOverBudget ? 'text-[#C24656]' : 'text-white'}`}>
            {Math.round(percentage)}<span className="text-sm align-top opacity-70">%</span>
          </span>
        </div>
      </div>

      {/* Labels & Data */}
      <div className="text-center w-full">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1 group-hover:text-white transition-colors">
          {label}
        </div>

        <div className="flex flex-col justify-center items-center gap-0.5">
          <div className="text-sm font-mono text-white/90">
            {formatCurrency(data.spent)}
          </div>

          {/* Budget Limit Bar/Text */}
          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            {formatCurrency(data.budget)}
          </div>
        </div>
      </div>
    </div>
  );
}
