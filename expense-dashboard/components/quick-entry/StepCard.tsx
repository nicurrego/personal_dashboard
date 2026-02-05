'use client';

import React from 'react';

interface StepCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isActive?: boolean;
  headerRight?: React.ReactNode;
}

export function StepCard({
  title,
  subtitle,
  children,
  isActive = true,
  headerRight
}: StepCardProps) {
  return (
    <div
      className={`
        w-full flex-1 flex flex-col
        liquid-card p-6 pb-0 
        transition-all duration-500
        overflow-hidden
        h-full
        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
    >
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="text-sm text-secondary-text mt-1">{subtitle}</p>
          )}
        </div>
        {headerRight && (
          <div className="ml-4">
            {headerRight}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
