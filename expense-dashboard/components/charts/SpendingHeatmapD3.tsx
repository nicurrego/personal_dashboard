'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { createResponsiveSVG, formatCurrency, createTooltip } from '@/lib/d3-utils';
import { Expense } from '@/types';

interface SpendingHeatmapD3Props {
  expenses: Expense[];
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function SpendingHeatmapD3({ expenses, onExpand, onInfo, isExpanded = false }: SpendingHeatmapD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const dateRange = d3.extent(expenses, d => new Date(d.date)) as [Date, Date];
  const daysDiff = dateRange[0] && dateRange[1]
    ? (dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const tooMuchData = daysDiff > 180; // Limit to ~6 months

  useEffect(() => {
    if (!containerRef.current || expenses.length === 0 || tooMuchData) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const container = containerRef.current;

    // Margins logic: Expanded needs more space? Or standard?
    const margin = isExpanded
      ? { top: 40, right: 30, bottom: 30, left: 40 }
      : { top: 40, right: 20, bottom: 20, left: 30 };

    const { svg, g, width, height } = createResponsiveSVG(container, margin);

    // --- DATA TRANSFORMATION ---
    const dailyMap = new Map<string, number>();

    expenses.forEach(e => {
      const d = new Date(e.date);
      // Normalized Key: YYYY-MM-DD
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + e.value);
    });

    // Generate full daily grid for the range
    const days = d3.timeDays(dateRange[0], dateRange[1]);
    // Add the last day inclusive
    days.push(dateRange[1]);

    // Data Structure
    const data = days.map(d => {
      const key = d.toISOString().split('T')[0];
      return {
        date: d,
        value: dailyMap.get(key) || 0,
        dayParams: {
          dayOfWeek: d.getDay(), // 0 = Sunday
          // Week number relative to start
          weekIndex: d3.timeSunday.count(dateRange[0], d)
        }
      };
    });

    // --- SCALES ---
    // X Axis: Weeks
    const maxWeeks = d3.max(data, d => d.dayParams.weekIndex) || 0;

    // Check if we have too many weeks for the width?
    // If we have > 52 weeks in a non-expanded view (approx 350px width => 6px/cell), it's tight.
    // But we are handling the "hard limit" via tooMuchData

    // Cells should be square optimally.
    const cellSize = Math.min(
      width / (maxWeeks + 1),
      height / 7
    );

    const xScale = d3.scaleLinear()
      .domain([0, maxWeeks])
      .range([0, cellSize * maxWeeks]);

    // Y Axis: Days (0 to 6)
    const yScale = d3.scaleBand()
      .domain([0, 1, 2, 3, 4, 5, 6] as any)
      .range([0, cellSize * 7])
      .padding(0.1);

    // Color Scale
    const maxVal = d3.max(data, d => d.value) || 0;

    // Resolve theme colors
    const style = getComputedStyle(document.documentElement);
    const colorStart = style.getPropertyValue('--color-kibo-bg').trim() || '#1B4034';
    const colorEnd = style.getPropertyValue('--color-total').trim() || '#A9D9C7';

    // Color Scale - Monochrome (Deep Green -> Bright Teal)
    const colorScale = d3.scaleLinear<string>()
      .domain([0, maxVal])
      .range([colorStart, colorEnd]);
    // Ramp from Darker BG -> Dark Teal -> Mid Teal -> Kibo Total Teal

    // --- DRAWING ---
    const tooltip = createTooltip(container);

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => xScale(d.dayParams.weekIndex))
      .attr('y', d => yScale(d.dayParams.dayOfWeek as any)!)
      .attr('width', cellSize - 1)
      .attr('height', cellSize - 1)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', d => d.value === 0 ? '#1B4032' : colorScale(d.value)) // Darker Kibo Green for empty, purple for val
      .attr('opacity', 0.8)
      .on('mouseover', function (event, d) {
        if (d.value === 0) return;

        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('opacity', 1);

        tooltip
          .html(`
            <strong>${d3.timeFormat('%Y-%m-%d')(d.date)}</strong><br/>
            ${formatCurrency(d.value)}
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
          .attr('stroke', 'none')
          .attr('opacity', 0.8);
        tooltip.style('visibility', 'hidden');
      });

    // --- AXIS LABELS ---
    // Y Axis: Days
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    g.selectAll('.dayLabel')
      .data(dayLabels)
      .join('text')
      .text(d => d)
      .attr('x', -6)
      .attr('y', (d, i) => (yScale(i as any)! + cellSize / 2))
      .style('text-anchor', 'end')
      .style('alignment-baseline', 'middle')
      .style('font-size', '10px')
      .style('fill', '#9ca3af');

    // X Axis: Weeks/Dates
    // Group data by weekIndex to find the start date of each week
    const weeksData = d3.groups(data, d => d.dayParams.weekIndex);

    // Determine label frequency
    const totalWeeks = weeksData.length;
    let labelStep = 1;
    if (totalWeeks > 10) labelStep = 4; // Monthly-ish
    if (totalWeeks > 30) labelStep = 8; // Bi-monthly-ish

    const xLabels = weeksData.filter(d => d[0] % labelStep === 0).map(d => {
      const weekIndex = d[0];
      const daysInWeek = d[1];
      // Find the earliest date in this week column
      const minDate = d3.min(daysInWeek, x => x.date) as Date;
      return { weekIndex, date: minDate };
    });

    g.selectAll('.xLabel')
      .data(xLabels)
      .join('text')
      .text(d => {
        // If zooming in (few weeks), show "Jan 1"
        if (totalWeeks <= 12) return d3.timeFormat('%b %d')(d.date);
        // If widely zoomed, show "Jan"
        return d3.timeFormat('%b')(d.date);
      })
      .attr('x', d => xScale(d.weekIndex))
      .attr('y', -10)
      .style('text-anchor', 'start')
      .style('font-size', '10px')
      .style('fill', '#9ca3af');

  }, [expenses, isExpanded, tooMuchData]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-[#1B4034]' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">Spending Heatmap</h2>
          <div className="flex items-center gap-2">
            {onInfo && (
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
            )}
            {/* Hide expand if too much data, or maybe allow it? If too much data, expand doesn't help if cells are microscopic. Let's hide it for now or disable it. User said "instead of the chart put a message". */}
            {onExpand && !tooMuchData && (
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
            )}
          </div>
        </div>
      )}

      {tooMuchData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4" style={{ height: isExpanded ? '100%' : '300px' }}>
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Too Much Data</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              There is too much history to display comfortably in this heatmap.
              <br /><br />
              <span className="text-cyan-400 font-medium">Please filter by Month or Year</span> to zoom in and see your patterns.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full relative">
          <div
            ref={containerRef}
            className={`w-full relative ${isExpanded ? 'flex-1' : ''}`}
            style={{ height: isExpanded ? 'calc(100% - 40px)' : '260px' }}
          />

          {/* Legend */}
          <div className={`flex items-center justify-end gap-3 px-4 ${isExpanded ? 'pb-8' : 'pb-2'} text-xs text-secondary-text`}>
            <span>Less</span>
            <div className="w-24 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #1B4032, #2A6B58, #6CA1B7, #A9D9C7)' }} />
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}
