'use client';

import React from 'react';

interface WelcomeHeaderProps {
    userName?: string;
}

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
};

const getFormattedDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
};

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
    const greeting = getGreeting();
    const date = getFormattedDate();
    const displayName = userName || 'User';

    return (
        <div className="relative mb-6">
            {/* Date badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
                      bg-white/5 border border-white/10 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-growth-green animate-pulse" />
                <span className="text-xs text-secondary-text font-medium capitalize">
                    {date}
                </span>
            </div>

            {/* Greeting */}
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                {greeting},
            </h1>

            {/* Welcome back message */}
            <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl text-gradient-cyan-green font-semibold">
                    Bienvenido de vuelta
                </span>
                <span className="text-2xl">👋</span>
            </div>

            {/* Subtitle */}
            <p className="text-secondary-text text-sm mt-2 max-w-sm">
                Tu asistente financiero personal está listo para ayudarte.
            </p>

            {/* Decorative line */}
            <div className="absolute -bottom-3 left-0 h-px w-24 
                      bg-gradient-to-r from-cyber-cyan to-transparent" />
        </div>
    );
}
