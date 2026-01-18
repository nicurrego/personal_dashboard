'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ChartProps } from './types';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { createTooltip, formatCurrency } from '@/lib/d3-utils';

export function BudgetFlowD3({ totals, size }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isSmall = size === 'small';
  const totalExpenses = totals.future + totals.living + totals.present;

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || (isSmall ? 96 : 200);
    
    const margin = isSmall 
      ? { top: 4, right: 4, bottom: 4, left: 4 }
      : { top: 20, right: 20, bottom: 20, left: 20 };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);
    
    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Income source gradient
    const incomeGradient = defs.append('linearGradient')
      .attr('id', 'flow-income-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    incomeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#a855f7');
    incomeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed');
    
    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'flow-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Calculate proportions
    const total = Math.max(totalExpenses, 1);
    const futureHeight = (totals.future / total) * height * 0.8;
    const livingHeight = (totals.living / total) * height * 0.8;
    const presentHeight = (totals.present / total) * height * 0.8;
    
    // Positions
    const sourceX = isSmall ? width * 0.1 : width * 0.15;
    const targetX = isSmall ? width * 0.7 : width * 0.75;
    const sourceWidth = isSmall ? 12 : 24;
    const targetWidth = isSmall ? 10 : 18;
    
    const buckets = [
      { label: 'Future', value: totals.future, color: CATEGORY_COLORS.FUTURE, height: futureHeight },
      { label: 'Living', value: totals.living, color: CATEGORY_COLORS.LIVING, height: livingHeight },
      { label: 'Present', value: totals.present, color: CATEGORY_COLORS.PRESENT, height: presentHeight },
    ].filter(d => d.value > 0);
    
    // Calculate vertical positions for buckets
    let currentY = (height - buckets.reduce((sum, b) => sum + b.height, 0) - (buckets.length - 1) * 8) / 2;
    buckets.forEach((bucket, i) => {
      (bucket as any).y = currentY;
      currentY += bucket.height + 8;
    });
    
    // Tooltip (only for large)
    const tooltip = !isSmall ? createTooltip(container) : null;
    
    // Draw income source bar
    const sourceBar = g.append('rect')
      .attr('x', sourceX - sourceWidth / 2)
      .attr('y', height * 0.1)
      .attr('width', sourceWidth)
      .attr('height', height * 0.8)
      .attr('fill', 'url(#flow-income-gradient)')
      .attr('rx', isSmall ? 3 : 6)
      .style('filter', 'url(#flow-glow)')
      .attr('opacity', 0);
    
    sourceBar.transition()
      .duration(800)
      .attr('opacity', 1);
    
    // Draw flow paths with animation
    buckets.forEach((bucket: any, i) => {
      const sourceY = height * 0.1 + (i / Math.max(buckets.length - 1, 1)) * height * 0.6 + height * 0.1;
      const targetY = bucket.y + bucket.height / 2;
      
      // Create curved path
      const pathData = `
        M ${sourceX + sourceWidth / 2} ${sourceY}
        C ${(sourceX + targetX) / 2} ${sourceY},
          ${(sourceX + targetX) / 2} ${targetY},
          ${targetX - targetWidth / 2} ${targetY}
      `;
      
      const path = g.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', bucket.color)
        .attr('stroke-width', isSmall ? 2 : Math.max(3, bucket.height / 8))
        .attr('opacity', 0.6)
        .style('filter', 'url(#flow-glow)');
      
      // Animate path drawing
      const pathLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .delay(400 + i * 150)
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    });
    
    // Draw target buckets
    buckets.forEach((bucket: any, i) => {
      const rect = g.append('rect')
        .attr('x', targetX - targetWidth / 2)
        .attr('y', bucket.y)
        .attr('width', targetWidth)
        .attr('height', Math.max(bucket.height, isSmall ? 8 : 16))
        .attr('fill', bucket.color)
        .attr('rx', isSmall ? 2 : 4)
        .style('filter', 'url(#flow-glow)')
        .attr('opacity', 0)
        .style('cursor', isSmall ? 'default' : 'pointer');
      
      rect.transition()
        .delay(600 + i * 150)
        .duration(500)
        .attr('opacity', 1);
      
      // Hover (large only)
      if (!isSmall && tooltip) {
        rect
          .on('mouseover', function(event) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('width', targetWidth + 4)
              .attr('x', targetX - (targetWidth + 4) / 2);
            
            tooltip
              .html(`
                <strong style="color: ${bucket.color}">${bucket.label}</strong><br/>
                ${formatCurrency(bucket.value)}<br/>
                ${Math.round((bucket.value / total) * 100)}% of expenses
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
              .attr('width', targetWidth)
              .attr('x', targetX - targetWidth / 2);
            
            tooltip.style('visibility', 'hidden');
          });
      }
      
      // Labels (large only)
      if (!isSmall) {
        g.append('text')
          .attr('x', targetX + targetWidth / 2 + 12)
          .attr('y', bucket.y + bucket.height / 2)
          .attr('dy', '0.35em')
          .style('font-size', '11px')
          .style('font-weight', '600')
          .style('fill', bucket.color)
          .attr('opacity', 0)
          .text(bucket.label)
          .transition()
          .delay(800 + i * 150)
          .duration(300)
          .attr('opacity', 1);
      }
    });
    
    // Income label (large only)
    if (!isSmall) {
      g.append('text')
        .attr('x', sourceX)
        .attr('y', height * 0.1 - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#a855f7')
        .style('font-weight', '600')
        .text('Income');
      
      g.append('text')
        .attr('x', sourceX)
        .attr('y', height * 0.9 + 16)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#9ca3af')
        .text(formatCurrency(totals.income));
    }
    
  }, [totals, isSmall, totalExpenses]);
  
  const containerClass = isSmall ? 'w-28 h-24' : 'w-full h-48';
  
  return (
    <div className={`relative ${containerClass}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
