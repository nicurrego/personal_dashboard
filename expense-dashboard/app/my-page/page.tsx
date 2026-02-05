'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Settings, User, Star, Zap, Ghost, Loader2, Pencil, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { GoalCard } from '@/components/my-page/GoalCard';

export default function MyPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Unified Profile Data State (Matches DB Columns)
    const [profileData, setProfileData] = useState({
        identity_goal: '',
        identity_details: '',
        fuel_category: '',
        fuel_details: '',
        leak_category: '',
        leak_details: ''
    });

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
                    setProfileData({
                        identity_goal: data.identity_goal || '',
                        identity_details: data.identity_details || '',
                        fuel_category: data.fuel_category || '',
                        fuel_details: data.fuel_details || '',
                        leak_category: data.leak_category || '',
                        leak_details: data.leak_details || ''
                    });
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

    const updateField = (field: keyof typeof profileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
        debouncedSave({ [field]: value });
    };

    const handleSave = () => {
        setIsEditing(false);
        // Data is already auto-saving, but logic to force save could go here if needed.
        // For now, the debouncer handles it reliably as user types.
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

                {/* Design Your Life Section */}
                <section>
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Design Your Life</h2>
                            <p className="text-[#A9D9C7] text-sm leading-relaxed">
                                I’m here to help you afford the life you actually want. Let's figure out what matters to you (and what doesn't) so you can do more of the fun stuff.
                            </p>
                        </div>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`p-2 rounded-full ring-1 ring-inset transition-all ml-4 shrink-0 shadow-lg ${isEditing ? 'bg-[#A9D9C7] ring-[#A9D9C7] text-[#1B4034]' : 'bg-[#1B4032] ring-[#A9D9C7] text-[#A9D9C7]'}`}
                        >
                            {isEditing ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Card 1: The North Star */}
                        <GoalCard
                            title="The North Star"
                            icon={Star}
                            helpText='"The version of you that exists in the future. I will use this to measure if your daily transactions are moving you closer to him or further away."'
                            value={profileData.identity_goal}
                            onChange={(val) => updateField('identity_goal', val)}
                            placeholder="In 2 years, I have built... or I am living as a..."
                            detailsValue={profileData.identity_details}
                            onDetailsChange={(val) => updateField('identity_details', val)}
                            detailsQuestion="What is one specific purchase that proves you are becoming this person?"
                            detailsPlaceholder="e.g., Buying a website domain, paying for a marathon entry, investing in a specific course..."
                            isEditing={isEditing}
                        />

                        {/* Card 2: The Energy Asset */}
                        <GoalCard
                            title="The Energy Asset"
                            icon={Zap}
                            helpText='"High-ROI Spending. The category where capital allocation consistently yields positive returns for your mental or professional growth."'
                            value={profileData.fuel_category}
                            onChange={(val) => updateField('fuel_category', val)}
                            placeholder='[ Select your "Growth Engine" ]'
                            detailsValue={profileData.fuel_details}
                            onDetailsChange={(val) => updateField('fuel_details', val)}
                            detailsQuestion="How do you feel immediately after spending money here?"
                            detailsPlaceholder="e.g., 'I feel clearer headed,' 'I feel capable,' 'I feel reconnected with the world'..."
                            isSelect={true}
                            isEditing={isEditing}
                        />

                        {/* Card 3: The Ghost */}
                        <GoalCard
                            title="The Ghost"
                            icon={Ghost}
                            helpText='"The unconscious habit that haunts your progress. It usually appears when you are tired, stressed, or bored. Let&apos;s make it visible."'
                            value={profileData.leak_category}
                            onChange={(val) => updateField('leak_category', val)}
                            placeholder="[ Select the habit you want to track ]"
                            detailsValue={profileData.leak_details}
                            onDetailsChange={(val) => updateField('leak_details', val)}
                            detailsQuestion="What specific situation or emotion usually triggers this?"
                            detailsPlaceholder="e.g., 'Late night boredom,' 'Stress after client meetings,' 'Feeling lonely on Fridays'..."
                            isSelect={true}
                            isEditing={isEditing}
                        />
                    </div>
                </section>

            </main>
        </div>
    );
}
