'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BudgetProgress } from '@/lib/dataTransforms';
import { formatCurrency } from '@/lib/d3-utils';

interface BudgetProgressRingsProps {
  progress: BudgetProgress;
}

export default function BudgetProgressRings({ progress }: BudgetProgressRingsProps) {
  return (
    <div className="liquid-card p-6">
      <h2 className="text-sm font-bold text-secondary-text mb-6 uppercase tracking-wider flex items-center justify-between">
        Budget vs Actual
        <span className="text-[10px] bg-white/5 py-1 px-2 rounded-full border border-white/10 font-normal normal-case tracking-normal">
          Monthly Pace
        </span>
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <RingItem 
          label="Total" 
          data={progress.total} 
          colors={['#d946ef', '#a855f7']} // Flux Violet -> Purple
        />
        <RingItem 
          label="Living" 
          data={progress.living} 
          colors={['#06b6d4', '#3b82f6']} // Cyan -> Blue
        />
        <RingItem 
          label="Present" 
          data={progress.present} 
          colors={['#f59e0b', '#f97316']} // Amber -> Orange
        />
        <RingItem 
          label="Future" 
          data={progress.future} 
          colors={['#22c55e', '#10b981']} // Green -> Emerald
        />
      </div>
    </div>
  );
}

function RingItem({ 
  label, 
  data, 
  colors, 
}: { 
  label: string; 
  data: { spent: number; budget: number; remaining: number; percentage: number }; 
  colors: [string, string];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Guard against NaN or infinite percentages
  const percentage = isFinite(data.percentage) ? data.percentage : 0;
  const isOverBudget = percentage > 100;
  
  // Use Red gradient if over budget
  const displayColors = isOverBudget ? ['#ef4444', '#dc2626'] : colors;
  // const displayColors = colors; // Uncomment to allow original colors even if over budget (optional)

  // Use a unique ID for the gradient to avoid conflicts
  const gradientId = `gradient-${label.toLowerCase().replace(/\s/g, '-')}`;
  const glowId = `glow-${label.toLowerCase().replace(/\s/g, '-')}`;

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const width = 120; // Increased resolution for crispness
    const height = 120;
    const radius = Math.min(width, height) / 2;
    const strokeWidth = 10;
    
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Define Gradients & Filters
    const defs = svg.append('defs');
    
    // Linear Gradient
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', displayColors[0]);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', displayColors[1]);

    // Glow Filter
    const filter = defs.append('filter')
      .attr('id', glowId)
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
      
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
      
    // Background Circle (Track)
    g.append('circle')
      .attr('r', radius - strokeWidth / 2)
      .attr('fill', 'none')
      .attr('stroke', '#1f2937') // Dark gray
      .attr('stroke-width', strokeWidth)
      .attr('opacity', 0.5);
      
    // Progress Arc
    const arc = d3.arc()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
      .startAngle(0)
      .cornerRadius(strokeWidth / 2);
      
    // Animate arc
    // Cap visual arc at 100% for the ring itself, but show >100% in text
    const visualPercentage = Math.min(percentage, 100); 
    const targetAngle = (visualPercentage / 100) * 2 * Math.PI;
    
    const foreground = g.append('path')
      .datum({ endAngle: 0 })
      .attr('fill', `url(#${gradientId})`)
      // .attr('filter', `url(#${glowId})`) // Optional: Add glow? Might be too heavy. Let's keep it clean.
      .attr('d', arc as any);
      
    // Add a simple glow circle behind the head of the arc? Too complex for D3 simple arc.
    // Let's just shadow the path if possible.
    // SVG filters can be expensive. Let's try applying it.
    // foreground.attr('filter', `url(#${glowId})`); // Enabled glow
    
    foreground.transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attrTween('d', function(d: any) {
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function(t: any) {
          d.endAngle = interpolate(t);
          return arc(d) || '';
        };
      });
      
  }, [percentage, displayColors, gradientId, glowId]);

  return (
    <div className="flex flex-col items-center justify-center group">
      {/* Ring Container */}
      <div className="relative w-28 h-28 mb-4 transition-transform duration-300 group-hover:scale-105">
        <svg ref={svgRef} className="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" viewBox="0 0 120 120">
             {/* Filter improves readability of glow against dark bg */}
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-2xl font-bold tracking-tight ${isOverBudget ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
            {Math.round(percentage)}<span className="text-sm align-top opacity-70">%</span>
          </span>
        </div>
      </div>
      
      {/* Labels & Data */}
      <div className="text-center w-full">
        <div className="text-xs uppercase tracking-wider font-bold text-secondary-text mb-1 group-hover:text-white transition-colors">
          {label}
        </div>
        
        <div className="flex flex-col justify-center items-center gap-0.5">
          <div className="text-sm font-mono text-white/90">
            {formatCurrency(data.spent)}
          </div>
          
          {/* Budget Limit Bar/Text */}
          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
             <span className="w-1 h-1 rounded-full bg-gray-600"></span>
             {formatCurrency(data.budget)}
          </div>
        </div>
        
        {/* Over Budget Indicator (Text) */}
        {isOverBudget && (
          <div className="absolute -top-1 -right-1">
             {/* Could add a warning icon here if relative positioned correctly. Skipping for clean look. */}
          </div>
        )}
      </div>
    </div>
  );
}
