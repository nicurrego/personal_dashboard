'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { ChartProps } from './types';
import { createTooltip, formatCurrency, animatePath } from '@/lib/d3-utils';

export function BudgetProjectionD3({ totals, size, monthlyNetCashFlow = 0 }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isSmall = size === 'small';
  
  // Generate 12-month projection data
  const projectionData = useMemo(() => {
    const months = [];
    let cumulative = 0;
    
    for (let i = 0; i < 12; i++) {
      cumulative += monthlyNetCashFlow;
      months.push({
        month: i,
        label: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        value: cumulative,
        netFlow: monthlyNetCashFlow
      });
    }
    
    return months;
  }, [monthlyNetCashFlow]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || (isSmall ? 96 : 200);
    
    const margin = isSmall 
      ? { top: 8, right: 8, bottom: 8, left: 8 }
      : { top: 20, right: 30, bottom: 40, left: 60 };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);
    
    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Area gradient based on positive/negative
    const isPositive = monthlyNetCashFlow >= 0;
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'projection-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    
    if (isPositive) {
      areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.4);
      areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#22c55e').attr('stop-opacity', 0);
    } else {
      areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444').attr('stop-opacity', 0.4);
      areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444').attr('stop-opacity', 0);
    }
    
    // Line gradient
    const lineGradient = defs.append('linearGradient')
      .attr('id', 'projection-line-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', isPositive ? '#22c55e' : '#ef4444');
    lineGradient.append('stop').attr('offset', '100%').attr('stop-color', isPositive ? '#86efac' : '#fca5a5');
    
    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'projection-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 11])
      .range([0, width]);
    
    const yExtent = d3.extent(projectionData, d => d.value) as [number, number];
    const yMin = Math.min(yExtent[0], 0);
    const yMax = Math.max(yExtent[1], 0);
    const yPadding = Math.abs(yMax - yMin) * 0.1 || 1000;
    
    const yScale = d3.scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([height, 0]);
    
    // Tooltip
    const tooltip = !isSmall ? createTooltip(container) : null;
    
    // Draw zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');
    
    // Area generator
    const area = d3.area<typeof projectionData[0]>()
      .x(d => xScale(d.month))
      .y0(yScale(0))
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Line generator
    const line = d3.line<typeof projectionData[0]>()
      .x(d => xScale(d.month))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Draw area
    g.append('path')
      .datum(projectionData)
      .attr('fill', 'url(#projection-area-gradient)')
      .attr('d', area)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1);
    
    // Draw line with animation
    const linePath = g.append('path')
      .datum(projectionData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#projection-line-gradient)')
      .attr('stroke-width', isSmall ? 2 : 3)
      .attr('d', line)
      .style('filter', 'url(#projection-glow)');
    
    animatePath(linePath, 1200);
    
    // Draw dots (only if not small)
    if (!isSmall) {
      const dots = g.selectAll('.dot')
        .data(projectionData)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.month))
        .attr('cy', d => yScale(d.value))
        .attr('r', 0)
        .attr('fill', isPositive ? '#22c55e' : '#ef4444')
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');
      
      dots.transition()
        .delay((d, i) => 800 + i * 50)
        .duration(300)
        .attr('r', 5);
      
      // Hover interactions
      if (tooltip) {
        dots
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 8);
            
            tooltip
              .html(`
                <strong>${d.label}</strong><br/>
                Cumulative: ${formatCurrency(d.value)}<br/>
                Monthly: ${formatCurrency(d.netFlow)}
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
              .attr('r', 5);
            
            tooltip.style('visibility', 'hidden');
          });
      }
      
      // X-axis labels (show every 3 months)
      g.selectAll('.x-label')
        .data(projectionData.filter((d, i) => i % 3 === 0))
        .join('text')
        .attr('class', 'x-label')
        .attr('x', d => xScale(d.month))
        .attr('y', height + 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#9ca3af')
        .text(d => d.label);
      
      // Final value annotation
      const finalData = projectionData[projectionData.length - 1];
      g.append('text')
        .attr('x', xScale(11) + 8)
        .attr('y', yScale(finalData.value))
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', isPositive ? '#22c55e' : '#ef4444')
        .attr('opacity', 0)
        .text(formatCurrency(finalData.value))
        .transition()
        .delay(1500)
        .duration(500)
        .attr('opacity', 1);
    }
    
  }, [projectionData, isSmall, monthlyNetCashFlow]);
  
  const containerClass = isSmall ? 'w-full h-24' : 'w-full h-48';
  
  return (
    <div className={`relative ${containerClass}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
