'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { createResponsiveSVG, formatCurrency, formatPercentage } from '@/lib/d3-utils';

interface BurnRateGaugeD3Props {
  spent: number;
  budget: number;
  onExpand?: () => void;
  onInfo?: () => void;
  isExpanded?: boolean;
}

export default function BurnRateGaugeD3({ spent, budget, onExpand, onInfo, isExpanded = false }: BurnRateGaugeD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const container = containerRef.current;
    
    // Dimensions
    const containerWidth = container.clientWidth;
    // Dynamic height based on expansion, but Gauge is usually shorter
    const containerHeight = isExpanded ? (container.clientHeight || 400) : 250; 
    
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    // Calculate radius - Semi-circle needs 2x width vs height aspect, or fit within available
    // We want a generic arc
    const radius = Math.min(width / 2, height);
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);
      
    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${height + margin.top})`); // Bottom center of drawing area

    // --- LOGIC ---
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    // Time Progress: Clamp between 0 and 1
    const timeProgress = Math.min(Math.max(currentDay / daysInMonth, 0), 1);
    
    // Spending Progress
    const spendProgress = Math.min(spent / budget, 1.5); // Cap at 150% visual
    
    // Angle Scale: -90deg to +90deg (Semi-circle)
    // D3 Arcs use Radians. -PI/2 to PI/2.
    const angleScale = d3.scaleLinear()
      .domain([0, 1]) // 0% to 100%
      .range([-Math.PI / 2, Math.PI / 2]);

    // --- ARCS ---
    
    // 1. Arc Generators
    const arcWidth = isExpanded ? 40 : 25;
    
    // Outer Arc (Time)
    const timeArcRadius = radius;
    const timeArc = d3.arc()
      .innerRadius(timeArcRadius - arcWidth)
      .outerRadius(timeArcRadius)
      .cornerRadius(4);
      
    // Inner Arc (Spend)
    const spendArcRadius = radius - arcWidth - 10;
    const spendArc = d3.arc()
      .innerRadius(spendArcRadius - arcWidth)
      .outerRadius(spendArcRadius)
      .cornerRadius(4);
      
    // --- DRAWING ---

    // 1. Background Tracks
    // Time Track
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .attr('d', timeArc as any)
      .attr('fill', '#1f2937') // Gray-800
      .attr('opacity', 0.5);

    // Spend Track
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .attr('d', spendArc as any)
      .attr('fill', '#1f2937')
      .attr('opacity', 0.5);

    // 2. Active Bars
    
    // Time Bar (Blue/Cyan - Neutral)
    const timeAngle = angleScale(timeProgress);
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: timeAngle })
      .attr('d', timeArc as any)
      .attr('fill', '#3b82f6') // Blue-500
      .attr('opacity', 0.8)
      .attr('filter', 'url(#glow-blue)'); // We assume glow defs exist or add them

    // Spend Bar (Gradient Color based on status)
    // Calculate status
    const isOverBurn = (spendProgress > timeProgress);
    const spendColor = isOverBurn ? '#ec4899' : '#10b981'; // Pink (Bad) vs Green (Good)
    
    const spendAngle = angleScale(Math.min(spendProgress, 1)); // Visual cap for bar at 100%? Or let it go? 
    // Let's cap visual bar at 1 (100%), and use color to indicate overflow, 
    // OR allow it to go past. Range is set to PI/2. 
    // Let's re-scale domain to allow overflow up to 150% visually?
    // Let's stick to 0-100% on the main gauge, maybe over-burn turns red.
    
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: angleScale(Math.min(spendProgress, 1)) })
      .attr('d', spendArc as any)
      .attr('fill', spendColor)
      .attr('filter', isOverBurn ? 'url(#glow-pink)' : 'url(#glow-green)');

    // 3. Labels / Needle for 'Today'
    // Add a marker for "Today" on the outer ring? 
    // Actually the Blue bar *is* the marker for Time.
    
    // 4. Text Display
    const statusText = isOverBurn 
      ? `BURNING FAST (+${formatPercentage(spendProgress - timeProgress)})` 
      : `ON TRACK`;
      
    // Value Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -30)
      .attr('class', 'fill-white text-3xl font-bold')
      .text(Math.round(spendProgress * 100) + '%');
      
    // Label Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 0)
      .attr('class', 'fill-gray-400 text-sm font-mono tracking-widest uppercase')
      .text('Budget Used');
      
    // Warning / Status
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 30) // Below center
      .attr('class', isOverBurn ? 'fill-laser-pink font-bold text-sm' : 'fill-acid-green font-bold text-sm')
      .text(statusText);

    // Add Date Label (bottom left/right)
    g.append('text')
      .attr('x', -radius + 10)
      .attr('y', 20)
      .attr('class', 'fill-gray-500 text-xs')
      .text('Day 1');

    g.append('text')
      .attr('x', radius - 10)
      .attr('text-anchor', 'end')
      .attr('y', 20)
      .attr('class', 'fill-gray-500 text-xs')
      .text(`Day ${daysInMonth}`);

    // Definitions for Glow (Reuse existing or add)
    // Assuming d3-utils handles it, but maybe not specific colors. Adding here safely.
    const defs = svg.append('defs');
    
    // Pink Glow
    const filterPink = defs.append('filter').attr('id', 'glow-pink');
    filterPink.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMergePink = filterPink.append('feMerge');
    feMergePink.append('feMergeNode').attr('in', 'coloredBlur');
    feMergePink.append('feMergeNode').attr('in', 'SourceGraphic');

     // Green Glow
    const filterGreen = defs.append('filter').attr('id', 'glow-green');
    filterGreen.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMergeGreen = filterGreen.append('feMerge');
    feMergeGreen.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeGreen.append('feMergeNode').attr('in', 'SourceGraphic');

  }, [spent, budget, isExpanded]);

  return (
    <div className={`${isExpanded ? 'w-full h-full flex flex-col bg-void-black' : 'liquid-card p-5'}`}>
      {!isExpanded && (
        <div className="flex justify-between items-center mb-0">
          <h2 className="text-label text-secondary-text">Burn Rate</h2>
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
      <div 
        ref={containerRef} 
        className={`w-full relative ${isExpanded ? 'flex-1' : ''}`}
      />
    </div>
  );
}
