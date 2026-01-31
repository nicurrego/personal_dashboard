'use client';

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface InvestmentChartProps {
    totalInvested: number;
    pendingToInvest: number;
}

export function InvestmentChart({ totalInvested, pendingToInvest }: InvestmentChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const total = totalInvested + pendingToInvest;
    const investedPercentage = total > 0 ? (totalInvested / total) * 100 : 0;

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        const size = Math.min(containerWidth, 200);
        const thickness = 16;
        const radius = size / 2 - thickness;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', size)
            .attr('height', size)
            .append('g')
            .attr('transform', `translate(${size / 2}, ${size / 2})`);

        // Background arc (gray)
        const backgroundArc = d3.arc()
            .innerRadius(radius - thickness / 2)
            .outerRadius(radius + thickness / 2)
            .startAngle(0)
            .endAngle(2 * Math.PI)
            .cornerRadius(thickness / 2);

        svg.append('path')
            .attr('d', backgroundArc as unknown as string)
            .attr('fill', 'rgba(255, 255, 255, 0.1)');

        // Data arcs
        const data = [
            { value: investedPercentage, color: '#22c55e', label: 'Invertido' },
            { value: 100 - investedPercentage, color: '#f59e0b', label: 'Pendiente' }
        ];

        const pie = d3.pie<{ value: number; color: string; label: string }>()
            .value(d => d.value)
            .sort(null)
            .startAngle(-Math.PI / 2)
            .endAngle(3 * Math.PI / 2);

        const arc = d3.arc<d3.PieArcDatum<{ value: number; color: string; label: string }>>()
            .innerRadius(radius - thickness / 2)
            .outerRadius(radius + thickness / 2)
            .cornerRadius(thickness / 2)
            .padAngle(0.02);

        // Create gradient definitions
        const defs = svg.append('defs');

        // Green gradient
        const greenGradient = defs.append('linearGradient')
            .attr('id', 'greenGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');
        greenGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e');
        greenGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4');

        // Orange gradient
        const orangeGradient = defs.append('linearGradient')
            .attr('id', 'orangeGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');
        orangeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
        orangeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#d946ef');

        // Draw arcs with animation
        const arcs = svg.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('fill', (d, i) => i === 0 ? 'url(#greenGradient)' : 'url(#orangeGradient)')
            .attr('filter', 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))')
            .transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .attrTween('d', function (d) {
                const interpolate = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
                return function (t) {
                    return arc(interpolate(t)) || '';
                };
            });

        // Center text
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.2em')
            .attr('fill', 'white')
            .attr('font-size', '28px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'ui-monospace, monospace')
            .text(`${investedPercentage.toFixed(0)}%`);

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.5em')
            .attr('fill', '#8e8e93')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('letter-spacing', '0.1em')
            .text('INVERTIDO');

    }, [totalInvested, pendingToInvest, investedPercentage]);

    return (
        <div
            className="liquid-card-premium p-6 relative overflow-hidden"
            ref={containerRef}
        >
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer-effect pointer-events-none" />

            <div className="relative z-10">
                <h3 className="text-label text-cyber-cyan mb-4">Distribución de Inversión</h3>

                <div className="flex flex-col items-center">
                    <svg ref={svgRef} className="max-w-[200px]" />

                    {/* Legend */}
                    <div className="flex gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-growth-green to-cyber-cyan" />
                            <span className="text-xs text-secondary-text">Invertido</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-alert-amber to-laser-magenta" />
                            <span className="text-xs text-secondary-text">Pendiente</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
