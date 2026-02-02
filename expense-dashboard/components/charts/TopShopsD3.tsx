'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { createResponsiveSVG, formatCurrency, createTooltip } from '@/lib/d3-utils';
import { Expense } from '@/types';
import { getTopShops } from '@/lib/analytics';

interface TopShopsD3Props {
  expenses: Expense[];
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function TopShopsD3({ expenses, onExpand, onInfo, isExpanded = false }: TopShopsD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || expenses.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    // Top 5 for card, Top 20 for expanded
    const limit = isExpanded ? 20 : 5;
    const data = getTopShops(expenses, limit);

    // If no shops data, show message?
    if (data.length === 0) {
      // Logic for "No Shop Data" could be added here, but for now we render empty or D3 handles it
    }

    const container = containerRef.current;

    // Margins logic
    // Horizontal bars need space on LEFT for labels
    const margin = isExpanded
      ? { top: 20, right: 50, bottom: 20, left: 120 }
      : { top: 10, right: 40, bottom: 20, left: 100 };

    const { svg, g, width, height } = createResponsiveSVG(container, margin);

    // --- SCALES ---
    const y = d3.scaleBand()
      .domain(data.map(d => d.shop))
      .range([0, height])
      .padding(0.2);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .range([0, width]);

    // --- DRAWING ---
    const tooltip = createTooltip(container);

    // --- COLORS (Monochrome Kibo Purple) ---
    // User requested "monochrome" and "no gradients". 
    // We will use a solid fill, but defined in a simple way or just direct attribute.
    // However, keeping the gradient definition but making it single color is safest to minimize code churn
    // if we want to add subtle fade later. For now, strict solid.

    // Actually, let's just use fill directly on the rect to be clean.

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0) // Start from left
      .attr('y', d => y(d.shop)!)
      .attr('width', d => x(d.total))
      .attr('height', y.bandwidth())
      .attr('fill', 'var(--color-total)') // Solid Kibo Teal
      .attr('rx', 4)
      .attr('ry', 4)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        tooltip
          .html(`
            <strong>${d.shop}</strong><br/>
            ${formatCurrency(d.total)}<br/>
            <span class="text-gray-400 text-xs text-nowrap">${d.transactionCount} transactions</span>
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



    // Y Axis (Shop Names)
    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', '#e5e7eb')
      .style('font-size', '11px')
      .style('text-anchor', 'end')
      .text((d: unknown) => {
        const shop = d as string;
        return shop.length > 15 && !isExpanded ? shop.substring(0, 14) + '...' : shop;
      });

    // Label Values (on the right of bar)
    g.selectAll('.label')
      .data(data)
      .join('text')
      .attr('x', d => x(d.total) + 5)
      .attr('y', d => y(d.shop)! + y.bandwidth() / 2)
      .attr('dy', '.35em')
      .text(d => formatCurrency(d.total))
      .style('font-size', '10px')
      .style('fill', '#9ca3af');

    // Remove domain lines for cleaner look
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').remove();

  }, [expenses, isExpanded]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-[#1B4034]' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">Top Shops</h2>
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
