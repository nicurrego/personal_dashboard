'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Debug/Admin page to manually clear localStorage and reset to defaults
 * Access this page at: /reset-storage
 */
export default function ResetStoragePage() {
    const router = useRouter();
    const [cleared, setCleared] = useState(false);

    const handleClearStorage = () => {
        // Clear all localStorage
        localStorage.clear();

        // Set defaults for new user
        localStorage.setItem('mascot_type', 'kibo');
        localStorage.setItem('mascot_name', 'Kibo');

        setCleared(true);

        // Reload after a delay
        setTimeout(() => {
            router.push('/home');
            window.location.reload();
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#1B4034] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#1B4032] border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-alert-amber/20 flex items-center justify-center mx-auto">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-10 h-10 text-alert-amber"
                        >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Reset Local Storage
                        </h1>
                        <p className="text-[#A9D9C7] text-sm leading-relaxed">
                            This will clear all browser-stored settings and reset them to defaults.
                            This is useful if you're experiencing issues with old data persisting after account deletion.
                        </p>
                    </div>

                    {cleared && (
                        <div className="p-4 rounded-xl bg-growth-green/10 border border-growth-green/30">
                            <p className="text-growth-green font-semibold">
                                ✓ Storage cleared! Redirecting...
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleClearStorage}
                            disabled={cleared}
                            className="w-full py-3 rounded-xl font-semibold bg-alert-amber text-[#1B4034] hover:bg-alert-amber/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Clear Storage & Reset
                        </button>

                        <button
                            onClick={() => router.push('/home')}
                            className="w-full py-3 rounded-xl font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-xs text-[#A9D9C7]/60">
                            After clearing, default settings will be restored:<br />
                            • Mascot: Kibo<br />
                            • All preferences reset
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
