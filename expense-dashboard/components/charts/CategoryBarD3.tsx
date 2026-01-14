'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CategoryTotal } from '@/lib/types';
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
}

export default function CategoryBarD3({ data }: CategoryBarD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    const { svg, g, width, height } = createResponsiveSVG(container, {
      top: 20,
      right: 50,
      bottom: 20,
      left: 120 // More space for category names
    });
    
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
    
    // Color scale (Blue palette)
    const colorScale = d3.scaleSequential()
      .domain([0, data.length - 1])
      .interpolator(d3.interpolateBlues);
      
    // Draw Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.category) || 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d, i) => colorScale(data.length - i + 2)) // Lighter to darker
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
      .attr('x', d => xScale(d.total) + 5)
      .attr('y', d => (yScale(d.category) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .text(d => formatCurrency(d.total))
      .style('font-size', '12px')
      .style('fill', '#9ca3af') // Gray-400
      .style('opacity', 0)
      .transition()
      .delay((d, i) => i * 100 + 800)
      .duration(500)
      .style('opacity', 1);
      
    // Interactions
    g.selectAll('rect')
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#f59e0b'); // Highlight color orange
          
        tooltip
          .html(`
            <strong>${d.category}</strong><br/>
            Total: ${formatCurrency(d.total)}<br/>
            Transactions: ${d.count}<br/>
            Share: ${formatPercentage(d.percentage)}
          `)
          .style('visibility', 'visible');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function(event, d: any, i) {
        // Restore gradient color (getting index is tricky in v6+, d3.select(this).datum() helps, but index requires logic)
        // Simplest to just re-apply the color logic or a default color
        // But we can actually use the original data array to find index
        const index = data.findIndex(item => item.category === d.category);
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', colorScale(data.length - index + 2));
          
        tooltip.style('visibility', 'hidden');
      });
      
  }, [data]);
  
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-white">Top Spending Categories</h2>
      <div 
        ref={containerRef} 
        className="w-full relative"
        style={{ height: '400px' }}
      />
    </div>
  );
}
