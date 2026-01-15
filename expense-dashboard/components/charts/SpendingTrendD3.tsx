'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TrendDataPoint } from '@/lib/types';
import { 
  createResponsiveSVG, 
  createTooltip, 
  animatePath,
  formatCurrency,
  createStyledAxis 
} from '@/lib/d3-utils';

interface SpendingTrendD3Props {
  data: TrendDataPoint[];
  granularity: 'daily' | 'monthly';
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function SpendingTrendD3({ 
  data, 
  granularity, 
  onExpand, 
  onInfo, 
  isExpanded = false 
}: SpendingTrendD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    const margin = isExpanded
      ? { top: 30, right: 30, bottom: 30, left: 60 }
      : { top: 20, right: 30, bottom: 40, left: 70 };

    const { svg, g, width, height } = createResponsiveSVG(container, margin);
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .nice()
      .range([height, 0]);
    
    // Create line generators
    const totalLine = d3.line<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    const livingLine = d3.line<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.living))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    const presentLine = d3.line<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.present))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    const futureLine = d3.line<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.future))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    // Create axes with adaptive format
    const xAxis = d3.axisBottom(xScale)
      .ticks(granularity === 'daily' ? Math.min(data.length, 10) : 6)
      .tickFormat(granularity === 'daily' 
        ? d3.timeFormat('%d') as any  // Day number for daily view
        : d3.timeFormat('%b %Y') as any  // Month Year for monthly
      );
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatCurrency(d as number));
    
    createStyledAxis(g, xAxis, 'bottom', `translate(0,${height})`);
    createStyledAxis(g, yAxis, 'left');
    
    // Add grid lines - use darker color for dark background
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(6))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)')
      .attr('stroke-dasharray', '2,2');
    
    // Create gradients for area fills - much lower opacity for expanded view to prevent muddy overlaps
    const defs = svg.append('defs');
    const fillOpacity = isExpanded ? 0.05 : 0.25;
    
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
        .attr('stop-opacity', fillOpacity);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0);
    };
    
    createAreaGradient('living-gradient', '#06b6d4');
    createAreaGradient('present-gradient', '#f59e0b');
    createAreaGradient('future-gradient', '#22c55e');
    
    // Create area generators for each category
    const livingArea = d3.area<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.living))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    const presentArea = d3.area<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.present))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    const futureArea = d3.area<TrendDataPoint>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.future))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    // Add area fills only in non-expanded view (expanded view shows clean lines only)
    if (!isExpanded) {
      g.append('path')
        .datum(data)
        .attr('fill', 'url(#living-gradient)')
        .attr('d', livingArea);
      
      g.append('path')
        .datum(data)
        .attr('fill', 'url(#present-gradient)')
        .attr('d', presentArea);
      
      g.append('path')
        .datum(data)
        .attr('fill', 'url(#future-gradient)')
        .attr('d', futureArea);
    }
    
   // Draw lines with animation
    const lines = [
      { data, generator: totalLine, color: '#FFFFFF', width: 3, label: 'Total' },
      { data, generator: livingLine, color: '#06b6d4', width: 2, label: 'Living' },
      { data, generator: presentLine, color: '#f59e0b', width: 2, label: 'Present' },
      { data, generator: futureLine, color: '#22c55e', width: 2, label: 'Future' }
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
      .delay((_, i) => i * 50)
      .duration(300)
      .attr('r', granularity === 'daily' ? 3 : 4);
    
    // Tooltip
    const tooltip = createTooltip(container);
    
    dots
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', granularity === 'daily' ? 5 : 6);
        
        const formatDate = granularity === 'daily' 
          ? d3.timeFormat('%B %d, %Y')
          : d3.timeFormat('%B %Y');
          
        tooltip
          .html(`
            <strong>${formatDate(d.date)}</strong><br/>
            Total: ${formatCurrency(d.total)}<br/>
            <span style="color: #06b6d4">●</span> Living: ${formatCurrency(d.living)}<br/>
            <span style="color: #f59e0b">●</span> Present: ${formatCurrency(d.present)}<br/>
            <span style="color: #22c55e">●</span> Future: ${formatCurrency(d.future)}
          `)
          .style('visibility', 'visible');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', granularity === 'daily' ? 3 : 4);
        
        tooltip.style('visibility', 'hidden');
      });
    
  }, [data, granularity, isExpanded]);
  
  // Title based on granularity
  const chartTitle = granularity === 'daily' ? 'Daily Spending Trend' : 'Monthly Spending Trend';
  
  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-void-black' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">{chartTitle}</h2>
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
            top: '0px',
            right: '0px',
            display: 'flex',
            flexDirection: 'column',
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
            { label: 'Total', color: '#FFFFFF' },
            { label: 'Living', color: '#06b6d4' },
            { label: 'Present', color: '#f59e0b' },
            { label: 'Future', color: '#22c55e' }
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
          { label: 'Total', color: '#FFFFFF' },
          { label: 'Living', color: '#06b6d4' },
          { label: 'Present', color: '#f59e0b' },
          { label: 'Future', color: '#22c55e' }
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
