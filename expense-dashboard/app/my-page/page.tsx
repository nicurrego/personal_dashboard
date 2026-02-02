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
        <div className="min-h-screen bg-[#1B4034] pb-24"> {/* Solid Background */}
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
                <h1 className="text-2xl font-bold text-white tracking-tight">My Page</h1>
                <Link
                    href="/my-page/settings"
                    className="p-2 rounded-full bg-[#1B4034] hover:bg-[#1B4032] transition-colors text-white border border-[#A9D9C7]"
                >
                    <Settings className="w-5 h-5" />
                </Link>
            </header>

            <main className="max-w-lg mx-auto px-4 space-y-8">

                {/* Progress Overview (Solid Card) */}
                <section className="relative overflow-hidden rounded-3xl bg-[#1B4032] border border-[#A9D9C7] p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#A9D9C7] flex items-center justify-center text-white font-bold text-xl">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Your Progress</h2>
                            <p className="text-sm text-[#A9D9C7]">Level 1 • Novice Saver</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-[#A9D9C7]">Next Milestone</span>
                            <span className="text-white font-medium">Create Budget</span>
                        </div>
                        <div className="h-2 w-full bg-[#1B4034] rounded-full overflow-hidden">
                            <div className="h-full bg-[#A9D9C7] w-[35%] rounded-full" />
                        </div>
                    </div>
                </section>

                {/* Personality Section */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-2">Budget Personality</h2>
                        <p className="text-[#A9D9C7] text-sm">
                            Choose how you want the AI to help you manage your finances.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {personalities.map((p) => {
                            const isSelected = selectedPersonality === p.id;

                            // Map colors manually to palette
                            const borderColor = isSelected
                                ? (p.id === 'safe' ? 'border-[#A9D9C7]' : p.id === 'grow' ? 'border-[#614FBB]' : 'border-[#C24656]')
                                : 'border-[#A9D9C7]';

                            const bgColor = isSelected
                                ? '#1B4032' // Active solid
                                : '#1B4034'; // Inactive solid

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p.id)}
                                    className={`
                    w-full relative group overflow-hidden rounded-2xl p-5 text-left transition-all duration-300
                    border ${borderColor} bg-[${bgColor}]
                    ${isSelected ? 'shadow-md' : 'hover:border-[#A9D9C7]'}
                  `}
                                >

                                    <div className="relative z-10 flex items-start gap-4">
                                        <div className={`
                      p-3 rounded-xl bg-[#1B4034] border border-[#A9D9C7]
                      text-white shadow-sm
                    `}>
                                            {p.icon}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-[#A9D9C7]'} /* cat-pale */`}>
                                                    {p.title}
                                                </h3>
                                                {isSelected && (
                                                    <div className={`p-1 rounded-full ${p.id === 'safe' ? 'text-[#A9D9C7]' : p.id === 'grow' ? 'text-[#614FBB]' : 'text-[#C24656]'} bg-[#1B4034]`}>
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className={`text-sm leading-relaxed ${isSelected ? 'text-white' : 'text-[#A9D9C7]'} /* cat-pale */`}>
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
                    <div className="text-center py-8 rounded-2xl border border-dashed border-[#A9D9C7] bg-[#1B4032]">
                        <p className="text-[#A9D9C7]">Goal setting coming soon...</p>
                    </div>
                </section>

            </main>
        </div>
    );
}
