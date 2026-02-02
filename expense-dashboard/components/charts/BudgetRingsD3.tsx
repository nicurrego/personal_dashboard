'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { createResponsiveSVG, formatCurrency } from '@/lib/d3-utils';

export interface RingData {
    label: string;
    spent: number;
    budget: number;
    color: string;
}

interface BudgetRingsD3Props {
    data: RingData[];
}

export default function BudgetRingsD3({ data }: BudgetRingsD3Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || data.length === 0) return;

        // Clear previous chart
        d3.select(containerRef.current).selectAll('*').remove();

        const container = containerRef.current;

        // Square aspect ratio
        const size = Math.min(container.clientWidth, container.clientHeight || 400);
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select(container)
            .append('svg')
            .attr('width', size)
            .attr('height', size)
            .attr('viewBox', `0 0 ${size} ${size}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${size / 2},${size / 2})`);

        // Radius config
        const maxRadius = (size / 2) - Math.max(margin.top, margin.right);
        const ringWidth = maxRadius / (data.length * 1.5 + 1); // Dynamic width
        const gap = ringWidth / 2;

        // Background tracks
        data.forEach((d, i) => {
            const outerRadius = maxRadius - (i * (ringWidth + gap));
            const innerRadius = outerRadius - ringWidth;

            const arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(0)
                .endAngle(2 * Math.PI);

            // Track
            g.append('path')
                .attr('d', arc as any)
                .attr('fill', d.color) // Use the ring's color
                .attr('opacity', 0.15); // Low opacity for "empty" state
        });

        // Value arcs
        data.forEach((d, i) => {
            const outerRadius = maxRadius - (i * (ringWidth + gap));
            const innerRadius = outerRadius - ringWidth;

            // Calculate percentage, max 100% for visual circle (but maybe show overspent?)
            // User likely wants to see how much of the ring is filled. 
            // If overspent, maybe full circle + color change? Or just full circle.
            const percentage = Math.min(1, Math.max(0, d.budget > 0 ? d.spent / d.budget : 0));
            const endAngle = percentage * 2 * Math.PI;

            const arc = d3.arc<any>()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(0)
                .endAngle(endAngle)
                .cornerRadius(ringWidth / 2);

            // Animate
            const path = g.append('path')
                .datum({ endAngle: 0 })
                .attr('fill', d.color)
                .attr('d', arc as any);

            path.transition()
                .duration(1500)
                .attrTween('d', function (dat: any) {
                    const interpolate = d3.interpolate(0, endAngle);
                    return function (t: number) {
                        dat.endAngle = interpolate(t);
                        return arc(dat) as string;
                    }
                });

            // Labels (Optional: maybe icon or text?)
            // User sketch didn't strictly show labels on rings, just rings.
            // But we need to know what is what.
            // Let's add small text label at the start (top) or tooltip?
            // Trying to keep it minimalist as requested.
        });

    }, [data]);

    return (
        <div
            ref={containerRef}
            className="w-full aspect-square flex items-center justify-center max-w-[300px] mx-auto"
        />
    );
}
