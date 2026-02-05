'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Settings, User, Info, Plus, Minus, Star, Zap, Ghost, Loader2 } from 'lucide-react';
import { ALL_CATEGORIES } from '@/lib/constants/defaultCategories';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';

export default function MyPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    // Form State
    const [identity, setIdentity] = useState('');
    const [identityInfo, setIdentityInfo] = useState('');
    const [showIdentityInfo, setShowIdentityInfo] = useState(false);

    // Help Text State (Subtext visibility)
    const [showIdentityHelp, setShowIdentityHelp] = useState(false);
    const [showFuelHelp, setShowFuelHelp] = useState(false);
    const [showLeakHelp, setShowLeakHelp] = useState(false);

    const [fuelCategory, setFuelCategory] = useState('');
    const [fuelInfo, setFuelInfo] = useState('');
    const [showFuelInfo, setShowFuelInfo] = useState(false);

    const [leakCategory, setLeakCategory] = useState('');
    const [leakInfo, setLeakInfo] = useState('');
    const [showLeakInfo, setShowLeakInfo] = useState(false);

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setIdentity(data.identity_goal || '');
                    setIdentityInfo(data.identity_details || '');
                    setFuelCategory(data.fuel_category || '');
                    setFuelInfo(data.fuel_details || '');
                    setLeakCategory(data.leak_category || '');
                    setLeakInfo(data.leak_details || '');

                    if (data.identity_details) setShowIdentityInfo(true);
                    if (data.fuel_details) setShowFuelInfo(true);
                    if (data.leak_details) setShowLeakInfo(true);
                } else if (error && error.code !== 'PGRST116') {
                    // PGRST116 is "Row not found" which is fine for new users
                    console.error('Error fetching profile:', error);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
                setMounted(true);
            }
        };

        fetchProfile();
    }, [router, supabase]);

    // Save to Supabase (Debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce(async (updates: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });

            if (error) console.error('Error saving profile:', error);
        }, 1000),
        []
    );

    const saveField = (key: string, value: string, setter: (val: string) => void) => {
        setter(value);

        // Map local state keys to DB column names
        const dbMap: Record<string, string> = {
            'user_identity': 'identity_goal',
            'user_identity_info': 'identity_details',
            'user_fuel_category': 'fuel_category',
            'user_fuel_info': 'fuel_details',
            'user_leak_category': 'leak_category',
            'user_leak_info': 'leak_details'
        };

        debouncedSave({ [dbMap[key]]: value });
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-[#1B4034] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#A9D9C7] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1B4034] pb-24 text-white">
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between max-w-lg mx-auto">
                <h1 className="text-2xl font-bold tracking-tight">My Page</h1>
                <Link
                    href="/my-page/settings"
                    className="p-2 rounded-full bg-[#1B4034] hover:bg-[#1B4032] transition-colors border border-[#A9D9C7]"
                >
                    <Settings className="w-5 h-5 text-white" />
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

                {/* Budget Personality & Goals Section */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-2">Design Your Life</h2>
                        <p className="text-[#A9D9C7] text-sm leading-relaxed">
                            I’m here to help you afford the life you actually want. Let's figure out what matters to you (and what doesn't) so you can do more of the fun stuff.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Card 1: The North Star (Identity) */}
                        <div className="bg-[#1B4032] border border-[#A9D9C7] rounded-2xl p-5 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-[#A9D9C7]" strokeWidth={1.5} />
                                    <label className="text-lg font-semibold">The North Star</label>
                                </div>
                                <button
                                    onClick={() => setShowIdentityHelp(!showIdentityHelp)}
                                    className={`transition-colors ${showIdentityHelp ? 'text-white' : 'text-[#A9D9C7] hover:text-white'}`}
                                >
                                    <Info className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                            </div>

                            {showIdentityHelp && (
                                <p className="text-sm text-[#A9D9C7] mb-4 italic leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                    "The version of you that exists in the future. I will use this to measure if your daily transactions are moving you closer to him or further away."
                                </p>
                            )}

                            <input
                                type="text"
                                value={identity}
                                onChange={(e) => saveField('user_identity', e.target.value, setIdentity)}
                                placeholder="In 2 years, I have built... or I am living as a..."
                                className="w-full bg-[#1B4034] border border-[#A9D9C7]/30 rounded-xl p-3 text-white placeholder-[#A9D9C7]/50 focus:outline-none focus:border-[#A9D9C7]"
                            />

                            <div className="mt-3 flex flex-col gap-2">
                                <button
                                    onClick={() => setShowIdentityInfo(!showIdentityInfo)}
                                    className="self-start text-xs text-[#A9D9C7] hover:text-white transition-colors font-medium flex items-center gap-1 mt-1"
                                >
                                    {showIdentityInfo ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />} details
                                </button>

                                {showIdentityInfo && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-xs text-[#A9D9C7] mb-2 font-medium">What is one specific purchase that proves you are becoming this person?</p>
                                        <textarea
                                            value={identityInfo}
                                            onChange={(e) => saveField('user_identity_info', e.target.value, setIdentityInfo)}
                                            placeholder="e.g., Buying a website domain, paying for a marathon entry, investing in a specific course..."
                                            className="w-full bg-[#1B4034]/50 border border-[#A9D9C7]/20 rounded-lg p-3 text-sm text-white placeholder-[#A9D9C7]/40 focus:outline-none focus:border-[#A9D9C7]/50 min-h-[80px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 2: The Energy Asset (Fuel Category) */}
                        <div className="bg-[#1B4032] border border-[#A9D9C7] rounded-2xl p-5 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-[#A9D9C7]" strokeWidth={1.5} />
                                    <label className="text-lg font-semibold">The Energy Asset</label>
                                </div>
                                <button
                                    onClick={() => setShowFuelHelp(!showFuelHelp)}
                                    className={`transition-colors ${showFuelHelp ? 'text-white' : 'text-[#A9D9C7] hover:text-white'}`}
                                >
                                    <Info className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                            </div>

                            {showFuelHelp && (
                                <p className="text-sm text-[#A9D9C7] mb-4 italic leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                    "High-ROI Spending. The category where capital allocation consistently yields positive returns for your mental or professional growth."
                                </p>
                            )}

                            <div className="relative">
                                <select
                                    value={fuelCategory}
                                    onChange={(e) => saveField('user_fuel_category', e.target.value, setFuelCategory)}
                                    className="w-full appearance-none bg-[#1B4034] border border-[#A9D9C7]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#A9D9C7]"
                                >
                                    <option value="" disabled>[ Select your "Growth Engine" ]</option>
                                    {ALL_CATEGORIES.map((item) => (
                                        <option key={item.category} value={item.category}>
                                            {item.category}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#A9D9C7]">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                                <button
                                    onClick={() => setShowFuelInfo(!showFuelInfo)}
                                    className="self-start text-xs text-[#A9D9C7] hover:text-white transition-colors font-medium flex items-center gap-1 mt-1"
                                >
                                    {showFuelInfo ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />} details
                                </button>

                                {showFuelInfo && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-xs text-[#A9D9C7] mb-2 font-medium">How do you feel immediately after spending money here?</p>
                                        <textarea
                                            value={fuelInfo}
                                            onChange={(e) => saveField('user_fuel_info', e.target.value, setFuelInfo)}
                                            placeholder="e.g., 'I feel clearer headed,' 'I feel capable,' 'I feel reconnected with the world'..."
                                            className="w-full bg-[#1B4034]/50 border border-[#A9D9C7]/20 rounded-lg p-3 text-sm text-white placeholder-[#A9D9C7]/40 focus:outline-none focus:border-[#A9D9C7]/50 min-h-[80px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 3: The Ghost (Leak Category) */}
                        <div className="bg-[#1B4032] border border-[#A9D9C7] rounded-2xl p-5 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Ghost className="w-5 h-5 text-[#A9D9C7]" strokeWidth={1.5} />
                                    <label className="text-lg font-semibold">The Ghost</label>
                                </div>
                                <button
                                    onClick={() => setShowLeakHelp(!showLeakHelp)}
                                    className={`transition-colors ${showLeakHelp ? 'text-white' : 'text-[#A9D9C7] hover:text-white'}`}
                                >
                                    <Info className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                            </div>

                            {showLeakHelp && (
                                <p className="text-sm text-[#A9D9C7] mb-4 italic leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                    "The unconscious habit that haunts your progress. It usually appears when you are tired, stressed, or bored. Let's make it visible."
                                </p>
                            )}

                            <div className="relative">
                                <select
                                    value={leakCategory}
                                    onChange={(e) => saveField('user_leak_category', e.target.value, setLeakCategory)}
                                    className="w-full appearance-none bg-[#1B4034] border border-[#A9D9C7]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#A9D9C7]"
                                >
                                    <option value="" disabled>[ Select the habit you want to track ]</option>
                                    {ALL_CATEGORIES.map((item) => (
                                        <option key={item.category} value={item.category}>
                                            {item.category}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#A9D9C7]">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                                <button
                                    onClick={() => setShowLeakInfo(!showLeakInfo)}
                                    className="self-start text-xs text-[#A9D9C7] hover:text-white transition-colors font-medium flex items-center gap-1 mt-1"
                                >
                                    {showLeakInfo ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />} details
                                </button>

                                {showLeakInfo && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-xs text-[#A9D9C7] mb-2 font-medium">What specific situation or emotion usually triggers this?</p>
                                        <textarea
                                            value={leakInfo}
                                            onChange={(e) => saveField('user_leak_info', e.target.value, setLeakInfo)}
                                            placeholder="e.g., 'Late night boredom,' 'Stress after client meetings,' 'Feeling lonely on Fridays'..."
                                            className="w-full bg-[#1B4034]/50 border border-[#A9D9C7]/20 rounded-lg p-3 text-sm text-white placeholder-[#A9D9C7]/40 focus:outline-none focus:border-[#A9D9C7]/50 min-h-[80px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
