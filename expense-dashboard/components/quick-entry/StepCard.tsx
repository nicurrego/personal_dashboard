'use client';

import React from 'react';

interface StepCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isActive?: boolean;
}

export function StepCard({ 
  title, 
  subtitle, 
  children,
  isActive = true 
}: StepCardProps) {
  return (
    <div 
      className={`
        w-full min-h-[60vh] flex flex-col
        liquid-card p-6 
        transition-all duration-500
        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-secondary-text mt-1">{subtitle}</p>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
