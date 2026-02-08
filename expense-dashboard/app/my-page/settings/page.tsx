'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface Profile {
    display_name: string;
    email: string;
    currency: string;
}

// Internal Modal Component
function ExitConfirmationModal({
    isOpen,
    onCancel,
    onConfirm
}: {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#1B4034]/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#1B4032] border border-white/20 rounded-3xl p-6 shadow-2xl scale-100 animate-scale-up">

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-alert-amber/20 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-alert-amber">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-white">Unsaved Changes</h3>
                    <p className="text-[#A9D9C7] text-sm leading-relaxed">
                        You have unsaved changes in your settings. leaving now will discard them.
                    </p>

                    <div className="w-full grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="w-full py-3 rounded-xl font-semibold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            Keep Editing
                        </button>
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 rounded-xl font-semibold bg-[#C24656] text-white hover:bg-[#A63643] transition-colors"
                        >
                            Discard & Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Initial values to track for unsaved changes
    const [initialDisplayName, setInitialDisplayName] = useState('');
    const [initialCurrency, setInitialCurrency] = useState('¥');
    const [initialMascotType, setInitialMascotType] = useState('kibo');
    const [initialMascotName, setInitialMascotName] = useState('Kibo');

    // Form states
    // Display Name
    const [displayName, setDisplayName] = useState('');
    const [currency, setCurrency] = useState('¥');

    // Mascot settings
    const [mascotType, setMascotType] = useState('kibo');
    const [mascotName, setMascotName] = useState('Kibo');

    // Advanced settings
    const [proBuilderMobile, setProBuilderMobile] = useState(false);
    const [initialProBuilderMobile, setInitialProBuilderMobile] = useState(false);

    // Password change states
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete account states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Navigation Protection State
    const [showExitModal, setShowExitModal] = useState(false);
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();

        // Load mascot settings
        const storedMascotType = localStorage.getItem('mascot_type');
        const storedMascotName = localStorage.getItem('mascot_name');

        if (storedMascotType) {
            setMascotType(storedMascotType);
            setInitialMascotType(storedMascotType);
        } else {
            // New user - set defaults
            setMascotType('kibo');
            setInitialMascotType('kibo');
        }

        if (storedMascotName) {
            setMascotName(storedMascotName);
            setInitialMascotName(storedMascotName);
        } else {
            // New user - set defaults
            setMascotName('Kibo');
            setInitialMascotName('Kibo');
        }

        // Load pro builder mobile setting
        const storedProBuilderMobile = localStorage.getItem('pro_builder_mobile');
        if (storedProBuilderMobile === 'true') {
            setProBuilderMobile(true);
            setInitialProBuilderMobile(true);
        }
    }, []);

    // Warn user before leaving if there are unsaved changes (Browser Refresh/Close)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [displayName, currency, mascotType, mascotName, initialDisplayName, initialCurrency, initialMascotType, initialMascotName]);

    const hasUnsavedChanges = () => {
        return (
            displayName !== initialDisplayName ||
            currency !== initialCurrency ||
            mascotType !== initialMascotType ||
            mascotName !== initialMascotName ||
            proBuilderMobile !== initialProBuilderMobile
        );
    };

    // Intercept internal navigation (Links)
    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href && hasUnsavedChanges()) {
                // Check if it's an internal link
                const isInternal = anchor.href.startsWith(window.location.origin);
                // Also check if it's not just a hash link or target blank
                const isSelf = anchor.target === '' || anchor.target === '_self';

                if (isInternal && isSelf) {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingUrl(anchor.href);
                    setShowExitModal(true);
                }
            }
        };

        // Capture phase to intercept before Next.js Link handles it
        document.addEventListener('click', handleAnchorClick, true);
        return () => document.removeEventListener('click', handleAnchorClick, true);
    }, [displayName, currency, mascotType, mascotName, initialDisplayName, initialCurrency, initialMascotType, initialMascotName]);

    const handleConfirmExit = () => {
        setShowExitModal(false);
        if (pendingUrl) {
            router.push(pendingUrl);
        }
    };

    const handleBackWithCheck = (e: React.MouseEvent) => {
        if (hasUnsavedChanges()) {
            e.preventDefault();
            setPendingUrl('/my-page');
            setShowExitModal(true);
        }
        // If no changes, the Link default behavior works, so no specific else needed if we used a button, 
        // but since we are wrapping a Link, we should just let it proceed if we didn't preventDefault.
        // Actually, it's cleaner to use a button or prevent default on the Link click.
    };

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Try to get profile, create if doesn't exist
        let { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile } = await supabase
                .from('profiles')
                .insert({ id: user.id, email: user.email, display_name: '' })
                .select()
                .single();
            profileData = newProfile;
        }

        if (profileData) {
            setProfile(profileData);
            setDisplayName(profileData.display_name || '');
            setInitialDisplayName(profileData.display_name || '');

            setCurrency(profileData.currency || '¥');
            setInitialCurrency(profileData.currency || '¥');
        }

        setLoading(false);
    };

    // Auto-update mascot name logic
    const handleMascotSelection = (newType: string) => {
        // If the user hasn't customized the name (i.e. name matches current type name), update it.
        // Or cleaner: check if the current name is just the capitalized version of the OLD type.

        // Let's check if the current name matches the capitalized version of the CURRENT (old) type.
        // e.g. type='kibo', name='Kibo' -> user selects 'kai'. Since name was 'Kibo', auto-switch to 'Kai'.
        // e.g. type='kibo', name='Buddy' -> user selects 'Kai'. Name stays 'Buddy'.

        const currentTypeCapitalized = mascotType.charAt(0).toUpperCase() + mascotType.slice(1);
        if (mascotName === currentTypeCapitalized) {
            const newName = newType.charAt(0).toUpperCase() + newType.slice(1);
            setMascotName(newName);
        }

        setMascotType(newType);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                currency,
            })
            .eq('id', user.id);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            // Save mascot settings to local storage
            localStorage.setItem('mascot_type', mascotType);
            localStorage.setItem('mascot_name', mascotName);
            localStorage.setItem('pro_builder_mobile', proBuilderMobile.toString());

            // Reset dirty state
            setInitialDisplayName(displayName);
            setInitialCurrency(currency);
            setInitialMascotType(mascotType);
            setInitialMascotName(mascotName);
            setInitialProBuilderMobile(proBuilderMobile);

            // Dispatch valid event to notify other components if needed
            window.dispatchEvent(new Event('storage'));

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        }

        setSaving(false);
    };

    const handleChangePassword = async () => {
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSaving(true);

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }

        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            // Call the server-side API to delete account
            const response = await fetch('/api/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: 'DELETE' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }

            // Account deleted successfully
            setMessage({ type: 'success', text: 'Account permanently deleted. Redirecting...' });

            // Clear all localStorage data
            if (data.clear_storage) {
                localStorage.clear();
            }

            // Redirect to home
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 1500);

        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to delete account'
            });
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1B4034] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[#1B4034] page-ambient">
                {/* Header */}
                <header className="border-b border-white/10 px-4 py-4">
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-white">Settings</h1>
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving || !hasUnsavedChanges()}
                            className={`
                                px-6 py-2 rounded-xl font-semibold text-sm transition-all
                                ${hasUnsavedChanges()
                                    ? 'bg-[#A9D9C7] text-[#1B4034] hover:brightness-110'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'}
                            `}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="max-w-2xl mx-auto p-6 space-y-6 pb-32 relative z-10">
                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-xl border ${message.type === 'success'
                            ? 'bg-growth-green/10 border-growth-green/30 text-growth-green'
                            : 'bg-laser-magenta/10 border-laser-magenta/30 text-laser-magenta'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Info */}
                    <div className="liquid-card-premium p-6 space-y-4 hover-lift relative z-10">
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                             text-secondary-text cursor-not-allowed"
                            />
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder:text-secondary-text/50
                             focus:border-cyber-cyan focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-2">
                                Currency Symbol
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white focus:border-cyber-cyan focus:outline-none transition-colors
                             [&>option]:bg-[#1B4034] [&>option]:text-white"
                            >
                                <option value="¥">¥ (Yen)</option>
                                <option value="$">$ (Dollar)</option>
                                <option value="€">€ (Euro)</option>
                                <option value="£">£ (Pound)</option>
                                <option value="₩">₩ (Won)</option>
                            </select>
                        </div>


                    </div>

                    {/* Mascot Customization */}
                    <div className="liquid-card-premium p-6 space-y-4 hover-lift relative z-10">
                        <h2 className="text-xl font-semibold text-white">Mascot Customization</h2>

                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-3">
                                Choose your companion
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['kibo', 'kai', 'riko', 'tane'].map((mascot) => (
                                    <button
                                        key={mascot}
                                        onClick={() => handleMascotSelection(mascot)}
                                        className={`
                                        relative p-2 rounded-xl transition-all duration-300
                                        flex flex-col items-center gap-2 group
                                        ${mascotType === mascot
                                                ? 'bg-cyber-cyan/10 border-2 border-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                                : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'}
                                    `}
                                    >
                                        <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
                                            <Image
                                                src={`/mascot/${mascot}/normal.png`}
                                                alt={mascot}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <span className={`text-sm font-medium capitalize ${mascotType === mascot ? 'text-cyber-cyan' : 'text-secondary-text'}`}>
                                            {mascot}
                                        </span>

                                        {mascotType === mascot && (
                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyber-cyan flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-[#1B4034]">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-2">
                                Give your mascot a name
                            </label>
                            <input
                                type="text"
                                value={mascotName}
                                onChange={(e) => setMascotName(e.target.value)}
                                placeholder="Mascot Name"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder:text-secondary-text/50
                         focus:border-cyber-cyan focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="liquid-card-premium p-6 space-y-4 hover-lift relative z-10">
                        <h2 className="text-xl font-semibold text-white">Advanced</h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Pro Builder on Mobile</p>
                                <p className="text-secondary-text text-xs">Show link to Pro Budget Builder on mobile devices</p>
                            </div>
                            <button
                                onClick={() => setProBuilderMobile(!proBuilderMobile)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${proBuilderMobile ? 'bg-cyber-cyan' : 'bg-white/20'
                                    }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${proBuilderMobile ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="liquid-card-premium p-6 space-y-4 hover-lift relative z-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Password</h2>
                            <button
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="text-cyber-cyan hover:text-cyber-cyan/80 text-sm font-medium transition-colors"
                            >
                                {showPasswordForm ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        {showPasswordForm && (
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-text mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder:text-secondary-text/50
                             focus:border-cyber-cyan focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-text mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder:text-secondary-text/50
                             focus:border-cyber-cyan focus:outline-none transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl font-semibold
                           bg-alert-amber text-[#1B4034]
                           hover:bg-alert-amber/90 transition-all"
                                >
                                    {saving ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="liquid-card-premium p-6 hover-lift">
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 rounded-xl font-semibold
                       bg-white/10 text-white border border-white/20
                       hover:bg-white/20 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="liquid-card-premium p-6 space-y-4 border-laser-magenta/30 hover-lift">
                        <h2 className="text-xl font-semibold text-laser-magenta">Danger Zone</h2>
                        <p className="text-sm text-secondary-text">
                            Once you delete your account, there is no going back. All your data will be permanently deleted.
                        </p>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-6 py-3 rounded-xl font-semibold
                          bg-laser-magenta/10 text-laser-magenta border border-laser-magenta/30
                          hover:bg-laser-magenta/20 transition-all"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="space-y-4 p-4 rounded-xl bg-laser-magenta/5 border border-laser-magenta/30">
                                <p className="text-sm text-laser-magenta font-medium">
                                    Type DELETE to confirm account deletion:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full px-4 py-3 rounded-xl bg-[#1B4034]/50 border border-laser-magenta/50
                            text-white placeholder:text-secondary-text/50
                            focus:border-laser-magenta focus:outline-none transition-colors"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeleteConfirmText('');
                                        }}
                                        className="flex-1 py-3 rounded-xl font-semibold
                              bg-white/10 text-white
                              hover:bg-white/20 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmText !== 'DELETE'}
                                        className={`flex-1 py-3 rounded-xl font-semibold transition-all
                    ${deleteConfirmText === 'DELETE'
                                                ? 'bg-laser-magenta text-white hover:bg-laser-magenta/90'
                                                : 'bg-white/10 text-secondary-text cursor-not-allowed'
                                            }`}
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <ExitConfirmationModal
                isOpen={showExitModal}
                onCancel={() => setShowExitModal(false)}
                onConfirm={handleConfirmExit}
            />
        </>
    );
}
