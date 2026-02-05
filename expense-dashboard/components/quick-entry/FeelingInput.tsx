'use client';

import React from 'react';
import { KIBO_COLORS } from '@/lib/constants/colors';

interface FeelingOption {
    value: number;
    label: string;
    description: string;
    emoji: string;
    color: string;
}

const FEELING_OPTIONS: FeelingOption[] = [
    { value: 5, label: 'Great!', description: 'I will do it again!', emoji: '😄', color: KIBO_COLORS.FeelingGreat },
    { value: 4, label: 'Good', description: 'Satisfied with this', emoji: '🙂', color: KIBO_COLORS.FeelingGood },
    { value: 3, label: 'Neutral', description: 'Neither good nor bad', emoji: '😐', color: KIBO_COLORS.FeelingNeutral },
    { value: 2, label: 'Slight regret', description: 'Probably didn\'t need this', emoji: '😕', color: KIBO_COLORS.FeelingSlightRegret },
    { value: 1, label: 'Regret', description: 'I shouldn\'t have done this', emoji: '😞', color: KIBO_COLORS.FeelingRegret },
];

interface FeelingInputProps {
    value: number | null;
    onChange: (value: number | null) => void;
    onSubmit?: () => void;
}

export function FeelingInput({ value, onChange, onSubmit }: FeelingInputProps) {
    const handleSelect = (feelingValue: number) => {
        onChange(feelingValue);
        if (onSubmit) {
            setTimeout(onSubmit, 200);
        }
    };

    return (
        <div className="overflow-y-auto flex-1 -mx-2 px-2 pb-2">
            <div className="flex flex-col gap-3">
                {FEELING_OPTIONS.map((option) => {
                    const isSelected = value === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl
              border-2 transition-all duration-200
              ${isSelected
                                    ? 'border-current bg-white/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                }
              active:scale-[0.98]
            `}
                            style={{
                                borderColor: isSelected ? option.color : undefined,
                                boxShadow: isSelected ? `0 0 20px ${option.color}40` : undefined,
                            }}
                        >
                            {/* Emoji */}
                            <span className="text-3xl">{option.emoji}</span>

                            {/* Text content */}
                            <div className="flex-1 text-left">
                                <p
                                    className="font-semibold text-lg"
                                    style={{ color: isSelected ? option.color : '#FFFFFF' }}
                                >
                                    {option.label}
                                </p>
                                <p className="text-sm text-secondary-text">
                                    {option.description}
                                </p>
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                                <span
                                    className="text-xl font-bold"
                                    style={{ color: option.color }}
                                >
                                    ✓
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Skip hint */}
                <p className="text-xs text-secondary-text/50 text-center mt-2 pb-4">
                    This is optional • Press Next to skip
                </p>
            </div>
        </div>
    );
}

/**
 * Get the label for a feeling value (for display in Review)
 */
export function getFeelingLabel(value: number | null): string {
    if (value === null) return 'Not set';
    const option = FEELING_OPTIONS.find(o => o.value === value);
    return option ? `${option.emoji} ${option.label}` : 'Not set';
}

/**
 * Get the color for a feeling value
 */
export function getFeelingColor(value: number | null): string {
    if (value === null) return '#94a3b8';
    const option = FEELING_OPTIONS.find(o => o.value === value);
    return option?.color || '#94a3b8';
}
