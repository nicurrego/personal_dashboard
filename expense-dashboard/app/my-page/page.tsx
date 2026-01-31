'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, TrendingUp, Rocket, Settings, Check, User } from 'lucide-react';

type PersonalityType = 'safe' | 'grow' | 'moon';

interface PersonalityOption {
    id: PersonalityType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    borderColor: string;
}

const personalities: PersonalityOption[] = [
    {
        id: 'safe',
        title: 'Super Safe',
        description: "Don't want risks and want to have no red numbers never.",
        icon: <Shield className="w-8 h-8" />,
        color: 'text-cyber-cyan',
        gradient: 'from-cyber-cyan/20 to-blue-500/20',
        borderColor: 'border-cyber-cyan/50',
    },
    {
        id: 'grow',
        title: 'I want to grow',
        description: "Willing to cut expenses and improve the numbers on the budget.",
        icon: <TrendingUp className="w-8 h-8" />,
        color: 'text-growth-green',
        gradient: 'from-growth-green/20 to-emerald-500/20',
        borderColor: 'border-growth-green/50',
    },
    {
        id: 'moon',
        title: 'Give me the moon',
        description: "I want to accomplish my goals no matter what.",
        icon: <Rocket className="w-8 h-8" />,
        color: 'text-laser-magenta',
        gradient: 'from-laser-magenta/20 to-purple-500/20',
        borderColor: 'border-laser-magenta/50',
    },
];

export default function MyPage() {
    const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('budget_personality');
        if (saved) {
            setSelectedPersonality(saved as PersonalityType);
        }
    }, []);

    const handleSelect = (id: PersonalityType) => {
        setSelectedPersonality(id);
        localStorage.setItem('budget_personality', id);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black page-ambient pb-24">
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
                <h1 className="text-2xl font-bold text-white tracking-tight">My Page</h1>
                <Link
                    href="/my-page/settings"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white border border-white/10"
                >
                    <Settings className="w-5 h-5" />
                </Link>
            </header>

            <main className="max-w-lg mx-auto px-4 space-y-8">

                {/* Progress Overview (Placeholder) */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyber-cyan to-blue-500 flex items-center justify-center text-black font-bold text-xl">
                            <User className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Your Progress</h2>
                            <p className="text-sm text-secondary-text">Level 1 • Novice Saver</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary-text">Next Milestone</span>
                            <span className="text-white font-medium">Create Budget</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyber-cyan w-[35%] rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        </div>
                    </div>
                </section>

                {/* Personality Section */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-2">Budget Personality</h2>
                        <p className="text-secondary-text text-sm">
                            Choose how you want the AI to help you manage your finances.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {personalities.map((p) => {
                            const isSelected = selectedPersonality === p.id;

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p.id)}
                                    className={`
                    w-full relative group overflow-hidden rounded-2xl p-5 text-left transition-all duration-300
                    border
                    ${isSelected
                                            ? `${p.borderColor} bg-gradient-to-br ${p.gradient}`
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                        }
                  `}
                                >
                                    {/* Glow Effect */}
                                    {isSelected && (
                                        <div className={`absolute inset-0 opacity-20 bg-${p.color.split('-')[1]}-500 blur-xl`} />
                                    )}

                                    <div className="relative z-10 flex items-start gap-4">
                                        <div className={`
                      p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10
                      ${p.color} shadow-lg
                    `}>
                                            {p.icon}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                                    {p.title}
                                                </h3>
                                                {isSelected && (
                                                    <div className={`p-1 rounded-full ${p.color} bg-black/20`}>
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className={`text-sm leading-relaxed ${isSelected ? 'text-gray-200' : 'text-secondary-text'}`}>
                                                {p.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Goals Placeholder */}
                <section className="pt-4">
                    <h2 className="text-xl font-bold text-white mb-4">Goals</h2>
                    <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 bg-white/5">
                        <p className="text-secondary-text">Goal setting coming soon...</p>
                    </div>
                </section>

            </main>
        </div>
    );
}
