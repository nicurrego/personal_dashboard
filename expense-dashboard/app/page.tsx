'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Redirect if already logged in
        router.push('/home');
        return;
      }
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        router.push('/home');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyber-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-flux-violet/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Auth Header */}
      <div className="absolute top-4 right-4 z-20">
        {loading ? (
          <div className="w-8 h-8 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
        ) : user ? (
          <div className="flex items-center gap-4">
            <span className="text-secondary-text text-sm hidden sm:block">
              {user.email}
            </span>
            <Link
              href="/my-page"
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
            >
              My Page
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-white text-sm hover:text-cyber-cyan transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyber-cyan to-growth-green text-white text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-label mb-2 text-cyber-cyan">Finance Control Center</h2>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter shadow-lg">
          EXPENSE<span className="text-gray-500">.OS</span>
        </h1>
        <p className="mt-4 text-secondary-text font-mono text-sm tracking-wide">
          SYSTEM V2.0 // BUDGET + EXPENSES + ANALYTICS
        </p>
      </div>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Module 1: Dashboard */}
        <Link href="/dashboard" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-growth-green">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-growth-green">MODULE 01</span>
                <div className="w-2 h-2 rounded-full bg-growth-green animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Dashboard</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Visual analytics, KPIs, charts and spending insights.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-growth-green text-black px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all">
                Launch
              </span>
            </div>
          </div>
        </Link>

        {/* Module 2: Budget */}
        <Link href="/budget" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-flux-violet">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-flux-violet">MODULE 02</span>
                <div className="w-2 h-2 rounded-full bg-flux-violet" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Budget</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Plan and manage monthly financial targets.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-flux-violet text-white px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all">
                Configure
              </span>
            </div>
          </div>
        </Link>

        {/* Module 3: Expenses */}
        <Link href="/expenses" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-cyber-cyan">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-cyber-cyan">MODULE 03</span>
                <div className="w-2 h-2 rounded-full bg-cyber-cyan" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Expenses</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Raw data explorer for all transactions.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-cyber-cyan text-black px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                Explore
              </span>
            </div>
          </div>
        </Link>

        {/* Module 4: Quick Entry */}
        <Link href="/quick-entry" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-alert-amber">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-alert-amber">MODULE 04</span>
                <div className="w-2 h-2 rounded-full bg-alert-amber animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Quick Entry</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Fast mobile-first expense logging.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-alert-amber text-black px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
                Add New
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Mobile FAB for Quick Entry */}
      <Link
        href="/quick-entry"
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full 
                   bg-gradient-to-r from-alert-amber to-growth-green
                   flex items-center justify-center z-50
                   shadow-[0_0_30px_rgba(245,158,11,0.4)]
                   active:scale-95 transition-transform"
      >
        <span className="text-3xl text-white font-bold">+</span>
      </Link>

      {/* Footer */}
      <div className="mt-12 text-center relative z-10">
        <p className="text-secondary-text/50 text-xs font-mono">
          {user ? `Logged in as ${user.email}` : 'Sign in to sync your data across devices'}
        </p>
      </div>
    </div>
  );
}
