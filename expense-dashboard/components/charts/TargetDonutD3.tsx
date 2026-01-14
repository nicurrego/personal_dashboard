'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TargetDistribution } from '@/lib/types';
import { 
  createResponsiveSVG, 
  createTooltip, 
  formatCurrency, 
  formatPercentage,
  truncateText
} from '@/lib/d3-utils';

interface TargetDonutD3Props {
  data: TargetDistribution[];
}

export default function TargetDonutD3({ data }: TargetDonutD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    // Use a square aspect ratio for donut
    const containerWidth = container.clientWidth;
    const height = 400; // Fixed height
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', height);
      
    // Center the chart
    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${height / 2})`);
      
    const radius = Math.min(containerWidth, height) / 2 - 40;
    
    // Color scale mapping
    const colorMap: Record<string, string> = {
      'Living': '#10b981',   // Green
      'Present': '#3b82f6',  // Blue
      'Future': '#f59e0b'    // Orange
    };
    
    // Pie generator
    const pie = d3.pie<TargetDistribution>()
      .value(d => d.amount)
      .sort(null); // Keep original order if possible, or sort by size
      
    // Arc generator
    const arc = d3.arc<d3.PieArcDatum<TargetDistribution>>()
      .innerRadius(radius * 0.6) // Donut hole
      .outerRadius(radius);
      
    const arcHover = d3.arc<d3.PieArcDatum<TargetDistribution>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius + 10);
      
    // Tooltip
    const tooltip = createTooltip(container);
    
    // Draw Arcs
    const paths = g.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('fill', d => colorMap[d.data.target] || '#cbd5e1')
      .attr('d', arc)
      .attr('stroke', 'white')
      .attr('stroke-width', '2px')
      .style('cursor', 'pointer');
      
    // Animations
    paths.transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function(t) {
          d.endAngle = i(t);
          return arc(d) as string;
        }
      });
      
    // Interactions
    paths.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arcHover);
        
      tooltip
        .html(`
          <strong>${d.data.target}</strong><br/>
          Amount: ${formatCurrency(d.data.amount)}<br/>
          Share: ${formatPercentage(d.data.percentage)}
        `)
        .style('visibility', 'visible');
        
      // Update center text
      centerTextLabel.text(d.data.target);
      centerTextValue.text(formatPercentage(d.data.percentage));
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arc);
        
      tooltip.style('visibility', 'hidden');
      
      // Reset center text
      centerTextLabel.text('Total');
      centerTextValue.text(formatCurrency(d3.sum(data, item => item.amount)));
    });
    
    // Center Text (Dynamic)
    const totalAmount = d3.sum(data, d => d.amount);
    
    const centerTextLabel = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '16px')
      .style('fill', '#9ca3af') // Gray-400
      .text('Total');
      
    const centerTextValue = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.0em')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff') // White
      .text(formatCurrency(totalAmount));
      
    // Add Labels (if space permits)
    const textGroup = g.append('g');
    
    const labelArc = d3.arc<d3.PieArcDatum<TargetDistribution>>()
      .innerRadius(radius + 20)
      .outerRadius(radius + 20);
      
    textGroup.selectAll('text')
      .data(pie(data))
      .join('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', (d) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? 'start' : 'end';
      })
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#d1d5db') // Gray-300
      .text(d => d.data.percentage > 5 ? d.data.target : ''); // Only show label if > 5%
      
  }, [data]);
  
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-white">Spending Distribution</h2>
      <div 
        ref={containerRef} 
        className="w-full relative"
        style={{ height: '400px' }}
      />
    </div>
  );
}
