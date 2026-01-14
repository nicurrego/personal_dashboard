import * as d3 from 'd3';

/**
 * D3.js utility functions for chart creation
 */

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Create responsive SVG with margins
 */
export function createResponsiveSVG(
  container: HTMLElement,
  margin = { top: 20, right: 30, bottom: 40, left: 60 }
) {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight || 400;
  
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  return { svg, g, width, height, margin };
}

/**
 * Create gradient definition
 */
export function createGradient(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  id: string,
  colors: { offset: string; color: string }[]
) {
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', id)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  
  colors.forEach(({ offset, color }) => {
    gradient.append('stop')
      .attr('offset', offset)
      .attr('stop-color', color);
  });
  
  return gradient;
}

/**
 * Add tooltip to container
 */
export function createTooltip(container: HTMLElement) {
  return d3.select(container)
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '1000');
}

/**
 * Animate path drawing
 */
export function animatePath(
  path: d3.Selection<SVGPathElement, any, any, any>,
  duration = 1000
) {
  const totalLength = path.node()?.getTotalLength() || 0;
  
  path
    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(duration)
    .ease(d3.easeQuadInOut)
    .attr('stroke-dashoffset', 0);
}

/**
 * Create axis with custom styling
 */
export function createStyledAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  axis: d3.Axis<any>,
  position: 'bottom' | 'left' | 'right' | 'top',
  transform?: string
) {
  const axisGroup = g.append('g')
    .attr('class', `axis axis-${position}`)
    .call(axis);
  
  if (transform) {
    axisGroup.attr('transform', transform);
  }
  
  // Style the axis
  axisGroup.selectAll('path, line')
    .style('stroke', '#e5e7eb');
  
  axisGroup.selectAll('text')
    .style('fill', '#6b7280')
    .style('font-size', '12px');
  
  return axisGroup;
}

/**
 * Create animated bars
 */
export function animateBars(
  bars: d3.Selection<SVGRectElement | d3.BaseType, any, any, any>,
  heightScale: (d: any) => number,
  duration = 800
) {
  bars
    .attr('height', 0)
    .attr('y', (d, i, nodes) => {
      const bar = d3.select(nodes[i]);
      const finalY = parseFloat(bar.attr('y') || '0');
      return finalY + heightScale(d);
    })
    .transition()
    .duration(duration)
    .ease(d3.easeBackOut)
    .attr('height', (d) => heightScale(d))
    .attr('y', (d, i, nodes) => {
      return parseFloat(d3.select(nodes[i]).attr('y') || '0');
    });
}

/**
 * Truncate text to fit width
 */
export function truncateText(text: string, maxWidth: number, fontSize = 12): string {
  const avgCharWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + '...';
}

/**
 * Get color scale for targets
 */
export function getTargetColorScale() {
  return d3.scaleOrdinal<string>()
    .domain(['Living', 'Present', 'Future'])
    .range(['#10b981', '#3b82f6', '#f59e0b']);
}

/**
 * Get color scale for sequential data
 */
export function getSequentialColorScale(domain: [number, number]) {
  return d3.scaleSequential()
    .domain(domain)
    .interpolator(d3.interpolateBlues);
}
