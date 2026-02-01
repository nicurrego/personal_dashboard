'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface MascotMessage {
    text: string;
    mood: 'normal' | 'happy' | 'sad' | 'pleased';
}

interface MascotSectionProps {
    investmentPercentage: number;
    pendingPercentage: number;
    userName?: string;
}

const getMascotMessages = (
    investmentPercentage: number,
    pendingPercentage: number
): MascotMessage[] => {
    const messages: MascotMessage[] = [];

    // Primary message based on investment health
    if (investmentPercentage >= 80) {
        messages.push({
            text: "¡Excelente! Estás invirtiendo muy bien tu dinero 🎉",
            mood: 'happy'
        });
    } else if (investmentPercentage >= 50) {
        messages.push({
            text: "¡Vas por buen camino! Sigue así 💪",
            mood: 'pleased'
        });
    } else if (investmentPercentage >= 25) {
        messages.push({
            text: "Aún tienes margen para invertir más. ¡Tú puedes!",
            mood: 'normal'
        });
    } else {
        messages.push({
            text: "¡Animo! Cada pequeño paso cuenta para tu futuro 🌱",
            mood: 'sad'
        });
    }

    // Secondary motivational messages
    if (pendingPercentage > 50) {
        messages.push({
            text: "Tienes buenos fondos disponibles. ¿Consideraste invertir más?",
            mood: 'normal'
        });
    }

    return messages;
};

const getMascotImage = (mood: 'normal' | 'happy' | 'sad' | 'pleased'): string => {
    const images = {
        normal: '/mascot/normal.png',
        happy: '/mascot/happy.png',
        sad: '/mascot/sad.png',
        pleased: '/mascot/pleased.png'
    };
    return images[mood];
};

export function MascotSection({ investmentPercentage, pendingPercentage, userName }: MascotSectionProps) {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const messages = getMascotMessages(investmentPercentage, pendingPercentage);
    const currentMessage = messages[currentMessageIndex];

    // Rotate messages every 5 seconds
    useEffect(() => {
        if (messages.length <= 1) return;

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
                setIsAnimating(false);
            }, 300);
        }, 5000);

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="relative flex flex-col items-center">
            {/* Speech Bubble */}
            <div
                className={`
          relative mb-4 p-4 rounded-2xl
          bg-gradient-to-br from-[rgba(40,40,45,0.9)] to-[rgba(28,28,30,0.95)]
          border border-white/10 backdrop-blur-xl
          max-w-[280px] min-h-[80px]
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          transition-all duration-300
          ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        `}
            >
                {/* Bubble pointer */}
                <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0
                     border-l-[12px] border-l-transparent
                     border-r-[12px] border-r-transparent
                     border-t-[12px] border-t-[rgba(28,28,30,0.95)]"
                />

                {/* Message content */}
                <p className="text-white text-sm font-medium leading-relaxed text-center">
                    {currentMessage?.text}
                </p>

                {/* Message indicators */}
                {messages.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                        {messages.map((_, index) => (
                            <div
                                key={index}
                                className={`
                  w-1.5 h-1.5 rounded-full transition-all duration-300
                  ${index === currentMessageIndex
                                        ? 'bg-cyber-cyan w-4'
                                        : 'bg-white/30'}
                `}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Mascot Image */}
            <div className="relative animate-float">
                {/* Glow effect behind mascot */}
                <div
                    className={`
            absolute inset-0 rounded-full blur-3xl opacity-30
            ${currentMessage?.mood === 'happy' ? 'bg-growth-green' :
                            currentMessage?.mood === 'sad' ? 'bg-alert-amber' :
                                currentMessage?.mood === 'pleased' ? 'bg-flux-violet' :
                                    'bg-cyber-cyan'}
          `}
                />

                {/* Mascot container with animation */}
                <div
                    className="relative w-32 h-32 md:w-40 md:h-40 
                     transition-transform duration-500 hover:scale-105
                     drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                    <Image
                        src={getMascotImage(currentMessage?.mood || 'normal')}
                        alt="Kibo - Tu mascota financiera"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Floating particles around mascot */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
                <div className="absolute top-4 -left-3 w-1.5 h-1.5 bg-growth-green rounded-full animate-pulse delay-300" />
                <div className="absolute -bottom-1 right-4 w-1 h-1 bg-flux-violet rounded-full animate-pulse delay-500" />
            </div>

            {/* Mascot name */}
            <p className="mt-3 text-secondary-text text-xs font-medium tracking-wider uppercase">
                Kibo
            </p>
        </div>
    );
}
