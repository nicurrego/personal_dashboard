'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { createResponsiveSVG, formatCurrency, createTooltip } from '@/lib/d3-utils';
import { Expense } from '@/types';
import { getSpendingByDayOfWeek } from '@/lib/analytics';

interface DayOfWeekD3Props {
  expenses: Expense[];
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function DayOfWeekD3({ expenses, onExpand, onInfo, isExpanded = false }: DayOfWeekD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || expenses.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const data = getSpendingByDayOfWeek(expenses);

    const container = containerRef.current;

    // Margins logic
    const margin = isExpanded
      ? { top: 40, right: 30, bottom: 50, left: 60 }
      : { top: 20, right: 20, bottom: 30, left: 45 };

    const { svg, g, width, height } = createResponsiveSVG(container, margin);

    // --- SCALES ---
    const x = d3.scaleBand()
      .domain(data.map(d => d.day))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .range([height, 0]);

    // --- DRAWING ---
    const tooltip = createTooltip(container);

    // --- COLORS (Monochrome Kibo Purple) ---
    // User requested "monochrome" and "no gradients". 
    // We will use solid fill #614FBB. Keeping logic simple.

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.day) || 0)
      .attr('y', d => y(d.total))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.total))
      .attr('fill', 'var(--color-total)') // Solid Kibo Teal
      .attr('rx', 6)
      .attr('ry', 4)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        tooltip
          .html(`
            <strong>${d.day}</strong><br/>
            ${formatCurrency(d.total)}<br/>
            <span class="text-gray-400 text-xs text-nowrap">Avg: ${formatCurrency(d.avgTransaction)} /txn</span>
          `)
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      });



    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => isExpanded ? d : d.substring(0, 3))) // Full name if expanded, short if not
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('fill', '#9ca3af')
      .style('font-size', isExpanded ? '12px' : '10px');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
        if (d === 0) return '0';
        if (d as number >= 1000) return '¥' + (d as number / 1000) + 'k';
        return '¥' + d;
      }))
      .selectAll('text')
      .style('fill', '#9ca3af') // Keep gray for axis text or make it Teal/White? Gray is fine for secondary text.
      .style('font-size', '10px');

    // Remove domain lines for cleaner look
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').attr('stroke', '#374151').attr('stroke-dasharray', '2,2');

  }, [expenses, isExpanded]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-[#1B4034]' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">Day of Week Analysis</h2>
          <div className="flex items-center gap-2">
            {onInfo && (
              <button onClick={onInfo} className="p-1.5 rounded-lg text-[#A9D9C7]/70 hover:text-[#A9D9C7] hover:bg-[#A9D9C7]/10 transition-all border border-transparent hover:border-[#A9D9C7]/20" aria-label="Chart Info">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </button>
            )}
            {onExpand && (
              <button onClick={onExpand} className="p-1.5 rounded-lg text-[#A9D9C7]/70 hover:text-[#A9D9C7] hover:bg-[#A9D9C7]/10 transition-all border border-transparent hover:border-[#A9D9C7]/20" aria-label="Expand Chart">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              </button>
            )}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full relative ${isExpanded ? 'flex-1' : ''}`}
        style={{ height: isExpanded ? '100%' : '200px' }}
      />
    </div>
  );
}
