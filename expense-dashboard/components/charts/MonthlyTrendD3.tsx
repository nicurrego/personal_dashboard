'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyData } from '@/lib/types';
import { 
  createResponsiveSVG, 
  createTooltip, 
  animatePath,
  formatCurrency,
  createStyledAxis 
} from '@/lib/d3-utils';

interface MonthlyTrendD3Props {
  data: MonthlyData[];
}

export default function MonthlyTrendD3({ data }: MonthlyTrendD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    const { svg, g, width, height } = createResponsiveSVG(container, {
      top: 20,
      right: 30,
      bottom: 40,
      left: 70
    });
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
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
    
    createAreaGradient('living-gradient', '#10b981');
    createAreaGradient('present-gradient', '#3b82f6');
    createAreaGradient('future-gradient', '#f59e0b');
    
    // Add area fills
    const area = d3.area<MonthlyData>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#living-gradient)')
      .attr('d', area.y1(d => yScale(d.living)));
    
   // Draw lines with animation
    const lines = [
      { data, generator: totalLine, color: '#1f2937', width: 3, label: 'Total' },
      { data, generator: livingLine, color: '#10b981', width: 2, label: 'Living' },
      { data, generator: presentLine, color: '#3b82f6', width: 2, label: 'Present' },
      { data, generator: futureLine, color: '#f59e0b', width: 2, label: 'Future' }
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
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);
        
        const formatDate = d3.timeFormat('%B %Y');
        tooltip
          .html(`
            <strong>${formatDate(d.date)}</strong><br/>
            Total: ${formatCurrency(d.total)}<br/>
            <span style="color: #10b981">●</span> Living: ${formatCurrency(d.living)}<br/>
            <span style="color: #3b82f6">●</span> Present: ${formatCurrency(d.present)}<br/>
            <span style="color: #f59e0b">●</span> Future: ${formatCurrency(d.future)}
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
          .attr('r', 4);
        
        tooltip.style('visibility', 'hidden');
      });
    
    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 200}, 0)`);
    
    const legendItems = [
      { label: 'Total', color: '#1f2937' },
      { label: 'Living', color: '#10b981' },
      { label: 'Present', color: '#3b82f6' },
      { label: 'Future', color: '#f59e0b' }
    ];
    
    legendItems.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 2);
      
      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .text(item.label)
        .style('font-size', '12px')
        .style('fill', '#6b7280');
    });
    
  }, [data]);
  
  return (
    <div className="bg-trust-navy rounded-xl border border-neutral-800 shadow-xl p-5">
      <h2 className="text-lg font-bold mb-4 text-cyber-cyan tracking-wide uppercase">Monthly Spending Trend</h2>
      <div 
        ref={containerRef} 
        className="w-full relative"
        style={{ height: '400px' }}
      />
    </div>
  );
}
