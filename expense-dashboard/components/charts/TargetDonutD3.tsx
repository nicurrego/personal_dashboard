'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TargetDistribution } from '@/types';
import {
  createResponsiveSVG,
  createTooltip,
  formatCurrency,
  formatPercentage,
  truncateText
} from '@/lib/d3-utils';

interface TargetDonutD3Props {
  data: TargetDistribution[];
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function TargetDonutD3({ data, onExpand, onInfo, isExpanded = false }: TargetDonutD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Color scale mapping - Move inside component but initialize safely
  // We want to read these from CSS variables if possible
  const colorMap = {
    'Living': 'var(--color-living)',
    'Present': 'var(--color-present)',
    'Future': 'var(--color-future)',
    'Income': 'var(--color-total)'
  };

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Resolve CSS variables to actual values if needed, but for fill/stroke 'var()' works fine.
    // However, if we need standard colors for legend fallback, we can use these.

    // Clear previous chart

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const container = containerRef.current;
    // Use a square aspect ratio for donut
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 400;
    const height = isExpanded ? containerHeight : 400; // Dynamic height when expanded

    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', height);

    // Center the chart
    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${height / 2})`);

    // Removed local colorMap definition


    // Responsive Radius
    const minDim = Math.min(containerWidth, height);
    const radius = isExpanded ? (minDim / 2) - 20 : (minDim / 2) - 40;

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
      .attrTween('d', function (d) {
        const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function (t) {
          d.endAngle = i(t);
          return arc(d) as string;
        }
      });

    // Interactions
    paths.on('mouseover', function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arcHover as any);

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
      .on('mousemove', function (event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any);

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
      .style('font-weight', 'bold')
      .style('fill', 'var(--color-total)') // Total Teal
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

  }, [data, isExpanded]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-[#1B4034]' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-label text-secondary-text">Target Distribution</h2>
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
      >
      </div>

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
          {data.map(item => (
            <div key={item.target} className="flex items-center gap-2">
              <div
                style={{
                  width: '8px', height: '8px',
                  backgroundColor: colorMap[item.target as keyof typeof colorMap] || 'var(--color-future)',
                  borderRadius: '50%'
                }}
              />
              <span className="text-xs font-medium text-secondary-text">{item.target}</span>
              <span className="text-xs font-bold text-white ml-auto">{formatPercentage(item.percentage)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
