'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ChartProps } from './types';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { createTooltip, formatCurrency, formatPercentage } from '@/lib/d3-utils';

export function BudgetDonutD3({ totals, size }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const total = Math.max(totals.future + totals.living + totals.present, 1);
  const futurePercent = Math.round((totals.future / total) * 100);
  const livingPercent = Math.round((totals.living / total) * 100);
  const presentPercent = Math.round((totals.present / total) * 100);

  const isSmall = size === 'small';

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || (isSmall ? 96 : 200);

    const minDim = Math.min(containerWidth, containerHeight);
    const radius = (minDim / 2) - (isSmall ? 4 : 20);
    const innerRadius = radius * 0.6;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${containerHeight / 2})`);

    // Data for pie
    const pieData = [
      { label: 'Future', value: totals.future, color: CATEGORY_COLORS.FUTURE, percent: futurePercent },
      { label: 'Living', value: totals.living, color: CATEGORY_COLORS.LIVING, percent: livingPercent },
      { label: 'Present', value: totals.present, color: CATEGORY_COLORS.PRESENT, percent: presentPercent },
    ].filter(d => d.value > 0);

    // If no data, show empty state
    if (pieData.length === 0) {
      g.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', isSmall ? 4 : 6);
      return;
    }

    // Pie generator
    const pie = d3.pie<typeof pieData[0]>()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.02);

    // Arc generators
    const arc = d3.arc<d3.PieArcDatum<typeof pieData[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(isSmall ? 2 : 4);

    const arcHover = d3.arc<d3.PieArcDatum<typeof pieData[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8)
      .cornerRadius(isSmall ? 2 : 4);

    // Tooltip (only for large size)
    const tooltip = !isSmall ? createTooltip(container) : null;

    // Draw arcs with animation
    const arcs = g.selectAll('path')
      .data(pie(pieData))
      .join('path')
      .attr('fill', d => d.data.color)
      .attr('stroke', 'rgba(0,0,0,0.3)')
      .attr('stroke-width', 1)
      .style('cursor', isSmall ? 'default' : 'pointer');

    // Animate arcs
    arcs.transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t)) as string;
        };
      });

    // Hover interactions (only for large)
    if (!isSmall && tooltip) {
      arcs
        .on('mouseover', function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arcHover as any);

          tooltip
            .html(`
              <strong style="color: ${d.data.color}">${d.data.label}</strong><br/>
              Amount: ${formatCurrency(d.data.value)}<br/>
              Share: ${d.data.percent}%
            `)
            .style('visibility', 'visible');
        })
        .on('mousemove', function (event) {
          tooltip
            .style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arc as any);

          tooltip.style('visibility', 'hidden');
        });
    }

    // Center text (only for large)
    if (!isSmall) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .style('font-size', '12px')
        .style('fill', '#9ca3af')
        .style('font-weight', '500')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.1em')
        .text('Allocation');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('fill', '#ffffff')
        .text('100%');
    }

  }, [totals, isSmall, futurePercent, livingPercent, presentPercent]);

  const containerClass = isSmall ? 'w-24 h-24' : 'w-48 h-48';

  return (
    <div className={`relative ${containerClass}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend for large size */}
      {!isSmall && (
        <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-4 text-xs">
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
