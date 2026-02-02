'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyData } from '@/types';
import {
  createResponsiveSVG,
  createTooltip,
  animatePath,
  formatCurrency,
  createStyledAxis
} from '@/lib/d3-utils';

interface MonthlyTrendD3Props {
  data: MonthlyData[];
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function MonthlyTrendD3({ data, onExpand, onInfo, isExpanded = false }: MonthlyTrendD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const margin = isExpanded
      ? { top: 30, right: 30, bottom: 30, left: 60 } // Balanced margins
      : { top: 20, right: 30, bottom: 40, left: 70 };

    const { svg, g, width, height } = createResponsiveSVG(container, margin);

    // Create scales
    // Create scales
    // Handle single data point case
    const extent = d3.extent(data, d => d.date) as [Date, Date];
    let domain = extent;
    if (domain[0] && domain[1] && domain[0].getTime() === domain[1].getTime()) {
      const d = domain[0];
      // ±1 month for domain
      domain = [
        new Date(d.getFullYear(), d.getMonth() - 1, 1),
        new Date(d.getFullYear(), d.getMonth() + 1, 1)
      ];
    }

    const xScale = d3.scaleTime()
      .domain(domain)
      .range([0, width]);

    // Y Scale with headroom
    const maxVal = d3.max(data, d => d.total) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, maxVal === 0 ? 1000 : maxVal * 1.1])
      .nice()
      .range([height, 0]);

    // Create line generators
    const totalLine = d3.line<MonthlyData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const livingLine = d3.line<MonthlyData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.living))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const presentLine = d3.line<MonthlyData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.present))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const futureLine = d3.line<MonthlyData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.future))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d3.timeFormat('%b %Y') as any);

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatCurrency(d as number));

    createStyledAxis(g, xAxis, 'bottom', `translate(0,${height})`);
    createStyledAxis(g, yAxis, 'left');

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(6))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#f3f4f6')
      .attr('stroke-dasharray', '2,2');

    // Create gradients for area fills
    const defs = svg.append('defs');

    const createAreaGradient = (id: string, color: string) => {
      const gradient = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.3);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0);
    };

    // Removed gradient definitions per user request

    // Add area fills
    const area = d3.area<MonthlyData>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append('path')
      .datum(data)
      .attr('fill', 'var(--color-living)') // Living Blue (Dominant area)
      .attr('fill-opacity', 0.1)
      .attr('d', area.y1(d => yScale(d.living)));

    // Draw lines with animation
    const lines = [
      { data, generator: totalLine, color: 'var(--color-total)', width: 3, label: 'Total' }, // White/Teal for Total
      { data, generator: livingLine, color: 'var(--color-living)', width: 2, label: 'Living' },
      { data, generator: presentLine, color: 'var(--color-present)', width: 2, label: 'Present' },
      { data, generator: futureLine, color: 'var(--color-future)', width: 2, label: 'Future' }
    ];

    lines.forEach(({ data: lineData, generator, color, width }) => {
      const path = g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr('d', generator);

      animatePath(path, 1500);
    });

    // Add dots for data points on main line
    const dots = g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.total))
      .attr('r', 0)
      .attr('fill', '#1f2937')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    dots.transition()
      .delay((d, i) => i * 50)
      .duration(300)
      .attr('r', 4);

    // Tooltip
    const tooltip = createTooltip(container);

    dots
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);

        const formatDate = d3.timeFormat('%B %Y');
        tooltip
          .html(`
            <strong>${formatDate(d.date)}</strong><br/>
            Total: ${formatCurrency(d.total)}<br/>
            <span style="color: var(--color-living)">●</span> Living: ${formatCurrency(d.living)}<br/>
            <span style="color: var(--color-present)">●</span> Present: ${formatCurrency(d.present)}<br/>
            <span style="color: var(--color-future)">●</span> Future: ${formatCurrency(d.future)}
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
          .attr('r', 4);


        tooltip.style('visibility', 'hidden');
      });

  }, [data, isExpanded]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-[#1B4034]' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">Monthly Spending Trend</h2>
          {onExpand && (
            <div className="flex items-center gap-2">
              <button
                onClick={onInfo}
                className="p-2 -mr-2 text-secondary-text hover:text-white transition-colors"
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
                className="p-2 -mr-2 text-secondary-text hover:text-white transition-colors"
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

      {/* Chart Area */}
      <div
        ref={containerRef}
        className={`w-full relative ${isExpanded ? 'flex-1' : ''}`}
        style={{ height: isExpanded ? '100%' : '400px', flexGrow: 1 }}
      />

      {/* Legend - Floating in Expanded Mode */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            // Rotated 90deg CW: 
            // Top (of chart) -> Left (screen)
            // Right (of chart) -> Top (screen)  <- Wait, user wants Legend Top Right.
            // Bottom (of chart) -> Right (screen)
            // Left (of chart) -> Bottom (screen)
            //
            // User requested: "top right corner of the graph when it is in landscape mode (bottom right if you look at it from the pc perspective)"
            // PC Bottom Right (Phone Bottom Right).
            // This corresponds to Chart Bottom Right?  (Bottom -> Right, Right -> Top... confusing).
            // Let's rely on standard quadrants.
            // Screen Bottom Right = (Max X, Max Y) in Screen.
            // Screen X = Chart Y (inverted? or just swapped?)
            // If translate(-50%, -50%) rotate(90deg):
            // +X (Screen) = +Y (Chart).
            // +Y (Screen) = -X (Chart)?
            // It's safest to put it 'right: 0' and 'bottom: 0' and see.
            // To place at Screen Bottom Right:
            // Screen Bottom = Component Right Edge -> right: 0
            // Screen Right = Component Top Edge -> top: 0
            top: '0px',
            right: '0px',
            display: 'flex',
            flexDirection: 'column', // Vertical list looks better in corner? User said "horizontal style" earlier? 
            // User script: "Vertical list... on the left side".
            // Let's use 'column' to stack them neatly in the corner.
            gap: '8px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '12px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 10
          }}
        >
          {[
            { label: 'Total', color: 'var(--color-total)' },
            { label: 'Living', color: 'var(--color-living)' },
            { label: 'Present', color: 'var(--color-present)' },
            { label: 'Future', color: 'var(--color-future)' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                style={{ width: '8px', height: '8px', backgroundColor: item.color, borderRadius: '50%' }}
              />
              <span className="text-xs font-medium text-secondary-text">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legacy Legend for Desktop */}
      <div className={`flex flex-wrap gap-4 justify-center items-center ${isExpanded ? 'hidden' : 'mt-4'}`}>
        {[
          { label: 'Total', color: 'var(--color-total)' },
          { label: 'Living', color: 'var(--color-living)' },
          { label: 'Present', color: 'var(--color-present)' },
          { label: 'Future', color: 'var(--color-future)' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              style={{ width: '12px', height: '12px', backgroundColor: item.color, borderRadius: '3px' }}
            />
            <span className="text-xs font-medium text-secondary-text">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
