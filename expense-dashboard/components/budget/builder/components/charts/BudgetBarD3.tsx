'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ChartProps } from './types';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { createTooltip, formatCurrency } from '@/lib/d3-utils';

export function BudgetBarD3({ totals, size, monthlyNetCashFlow = 0 }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isSmall = size === 'small';
  const totalExpenses = totals.future + totals.living + totals.present;
  const isPositive = monthlyNetCashFlow >= 0;

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || (isSmall ? 96 : 200);
    
    const margin = isSmall 
      ? { top: 8, right: 8, bottom: 8, left: 8 }
      : { top: 20, right: 40, bottom: 40, left: 60 };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);
    
    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Income gradient (purple/violet)
    const incomeGradient = defs.append('linearGradient')
      .attr('id', 'income-bar-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    incomeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#a855f7');
    incomeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed');
    
    // Expenses gradient (based on status)
    const expenseGradient = defs.append('linearGradient')
      .attr('id', 'expense-bar-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    
    if (isPositive) {
      expenseGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4');
      expenseGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0891b2');
    } else {
      expenseGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444');
      expenseGradient.append('stop').attr('offset', '100%').attr('stop-color', '#dc2626');
    }
    
    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'bar-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Data
    const barData = [
      { label: 'Income', value: totals.income, fill: 'url(#income-bar-gradient)' },
      { label: 'Expenses', value: totalExpenses, fill: 'url(#expense-bar-gradient)' }
    ];
    
    const maxValue = Math.max(totals.income, totalExpenses, 1);
    
    // Scales
    const xScale = d3.scaleBand()
      .domain(barData.map(d => d.label))
      .range([0, width])
      .padding(isSmall ? 0.4 : 0.3);
    
    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([height, 0]);
    
    // Tooltip (only for large)
    const tooltip = !isSmall ? createTooltip(container) : null;
    
    // Draw bars with animation
    const bars = g.selectAll('.bar')
      .data(barData)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => d.fill)
      .attr('rx', isSmall ? 3 : 6)
      .style('filter', 'url(#bar-glow)')
      .style('cursor', isSmall ? 'default' : 'pointer');
    
    // Animate bars
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 200)
      .ease(d3.easeCubicOut)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value));
    
    // Hover interactions (only for large)
    if (!isSmall && tooltip) {
      bars
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.8)
            .style('filter', 'url(#bar-glow) brightness(1.2)');
          
          tooltip
            .html(`
              <strong>${d.label}</strong><br/>
              ${formatCurrency(d.value)}
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
            .attr('opacity', 1)
            .style('filter', 'url(#bar-glow)');
          
          tooltip.style('visibility', 'hidden');
        });
    }
    
    // Add value labels on top of bars (large only)
    if (!isSmall) {
      g.selectAll('.value-label')
        .data(barData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.value) - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#ffffff')
        .style('opacity', 0)
        .text(d => formatCurrency(d.value))
        .transition()
        .delay(1000)
        .duration(500)
        .style('opacity', 1);
      
      // Add x-axis labels
      g.selectAll('.x-label')
        .data(barData)
        .join('text')
        .attr('class', 'x-label')
        .attr('x', d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .attr('y', height + 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#9ca3af')
        .text(d => d.label);
    }
    
    // Add comparison line for small size
    if (isSmall) {
      // Draw a subtle line at income level for visual comparison
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(totals.income))
        .attr('y2', yScale(totals.income))
        .attr('stroke', '#8b5cf6')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);
    }
    
  }, [totals, isSmall, isPositive, totalExpenses, monthlyNetCashFlow]);
  
  const containerClass = isSmall ? 'w-full h-24' : 'w-full h-48';
  
  return (
    <div className={`relative ${containerClass}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
