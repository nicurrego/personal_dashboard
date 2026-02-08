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
    mascotTypeOverride?: string;
}

// Default to Kibo if nothing selected
const DEFAULT_MASCOT = 'kibo';
const DEFAULT_NAME = 'Kibo';

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

const getMascotImage = (type: string, mood: 'normal' | 'happy' | 'sad' | 'pleased'): string => {
    return `/mascot/${type}/${mood}.png`;
};

export function MascotSection({ investmentPercentage, pendingPercentage, userName, mascotTypeOverride }: MascotSectionProps) {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Mascot state
    const [mascotType, setMascotType] = useState(mascotTypeOverride || DEFAULT_MASCOT);
    const [mascotName, setMascotName] = useState(DEFAULT_NAME);

    useEffect(() => {
        // If override is present, do not respect local storage
        if (mascotTypeOverride) {
            setMascotType(mascotTypeOverride);
            setMascotName('Tane'); // Assuming Tane is the name for 'tane' type
            return;
        }

        // Otherwise load from local storage, or use defaults for new users
        const storedType = localStorage.getItem('mascot_type');
        const storedName = localStorage.getItem('mascot_name');

        if (storedType) {
            setMascotType(storedType);
        } else {
            // New user - ensure default is set
            setMascotType(DEFAULT_MASCOT);
        }

        if (storedName) {
            setMascotName(storedName);
        } else {
            // New user - ensure default is set
            setMascotName(DEFAULT_NAME);
        }
    }, [mascotTypeOverride]);

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
          bg-kibo-bg
          border border-kibo-teal/30 backdrop-blur-sm
          w-full max-w-sm min-h-[80px]
          shadow-[0_4px_12px_rgba(0,0,0,0.2)]
          transition-all duration-300
          ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        `}
            >
                {/* Bubble pointer */}
                <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0
                     border-l-[12px] border-l-transparent
                     border-r-[12px] border-r-transparent
                     border-t-[12px] border-t-kibo-bg"
                    style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}
                />

                {/* Add a border line for the pointer to match the bubble border if possible, 
                    but CSS triangles are tricky with borders. 
                    Simplified: just the shape color matches the bubble bg. 
                */}

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
                                        ? 'bg-kibo-teal w-4'
                                        : 'bg-kibo-teal/30'}
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
            ${currentMessage?.mood === 'happy' ? 'bg-kibo-purple' :
                            currentMessage?.mood === 'sad' ? 'bg-kibo-red' :
                                currentMessage?.mood === 'pleased' ? 'bg-kibo-blue' :
                                    'bg-kibo-teal'}
          `}
                />

                {/* Mascot container with animation */}
                <div
                    className="relative w-32 h-32 md:w-40 md:h-40 
                     transition-transform duration-500 hover:scale-105
                     drop-shadow-[0_0_10px_rgba(169,217,199,0.2)]"
                >
                    <Image
                        src={getMascotImage(mascotType, currentMessage?.mood || 'normal')}
                        alt={`${mascotName} - Tu mascota financiera`}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Floating particles around mascot */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-kibo-teal rounded-full animate-pulse" />
                <div className="absolute top-4 -left-3 w-1.5 h-1.5 bg-kibo-purple rounded-full animate-pulse delay-300" />
                <div className="absolute -bottom-1 right-4 w-1 h-1 bg-kibo-red rounded-full animate-pulse delay-500" />
            </div>
        </div>
    );
}
