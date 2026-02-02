'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CategoryTotal } from '@/types';
import {
  createResponsiveSVG,
  createTooltip,
  formatCurrency,
  formatPercentage,
  animateBars,
  createStyledAxis,
  truncateText
} from '@/lib/d3-utils';

interface CategoryBarD3Props {
  data: CategoryTotal[];
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function CategoryBarD3({ data, onExpand, onInfo, isExpanded = false }: CategoryBarD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const container = containerRef.current;

    // Adjust margins for expanded view
    const margin = isExpanded
      ? { top: 10, right: 30, bottom: 20, left: 140 } // More space for names on left
      : { top: 20, right: 50, bottom: 20, left: 120 };

    const { svg, g, width, height } = createResponsiveSVG(container, margin);

    // Create scales
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, height])
      .padding(0.3);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .nice()
      .range([0, width]);

    // Tooltip
    const tooltip = createTooltip(container);

    // Create Axes
    const yAxis = d3.axisLeft(yScale)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat(d => truncateText(d, 100)); // Truncate long names

    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => formatCurrency(d as number));

    createStyledAxis(g, yAxis, 'left');
    // Optional: Hide bottom axis for cleaner look if value labels are used
    // createStyledAxis(g, xAxis, 'bottom', `translate(0,${height})`);

    // Color scale (Monochrome Kibo Purple)
    // We'll just access the color directly
    // const colorScale = ... removed

    // Draw Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.category) || 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', 'var(--color-total)') // Solid Kibo Teal (Total)
      .attr('rx', 4) // Rounded corners
      .attr('width', 0) // Start at width 0 for animation
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('width', d => xScale(d.total));

    // Add Value Labels at end of bars
    g.selectAll('.label')
      .data(data)
      .join('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.total) + 8)
      .attr('y', d => (yScale(d.category) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .text(d => formatCurrency(d.total))
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#FFFFFF') // White
      .style('opacity', 0)
      .transition()
      .delay((d, i) => i * 100 + 800)
      .duration(500)
      .style('opacity', 1);

    // Interactions
    g.selectAll('rect')
      .on('mouseover', function (event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#A9D9C7')
          .attr('opacity', 1);
        // Removed glow filter

        tooltip
          .html(`
            <strong>${d.category}</strong><br/>
            Total: ${formatCurrency(d.total)}<br/>
            Transactions: ${d.count}<br/>
            Share: ${formatPercentage(d.percentage)}
          `)
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function (event, d) {
        // Restore gradient color
        const index = data.findIndex(item => item.category === (d as { category: string }).category);

        d3.select(this)
          .transition()
          .duration(200)
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#A9D9C7')
          .attr('opacity', 1)
          .attr('filter', 'none');

        tooltip.style('visibility', 'hidden');
      });

  }, [data, isExpanded]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-[#1B4034]' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">Top Categories</h2>
          {onExpand && (
            <div className="flex items-center gap-2">
              <button
                onClick={onInfo}
                className="p-1.5 rounded-lg text-[#A9D9C7]/70 hover:text-[#A9D9C7] hover:bg-[#A9D9C7]/10 transition-all border border-transparent hover:border-[#A9D9C7]/20"
                aria-label="Chart Info"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
              <button
                onClick={onExpand}
                className="p-1.5 rounded-lg text-[#A9D9C7]/70 hover:text-[#A9D9C7] hover:bg-[#A9D9C7]/10 transition-all border border-transparent hover:border-[#A9D9C7]/20"
                aria-label="Expand Chart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full relative ${isExpanded ? 'flex-1' : ''}`}
        style={{ height: isExpanded ? '100%' : '400px' }}
      />
    </div>
  );
}
