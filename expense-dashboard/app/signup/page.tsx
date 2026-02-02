'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#1B4034] flex items-center justify-center p-6 page-ambient">
        <div className="w-full max-w-md text-center relative z-10">
          <div className="bg-[#1B4034] border border-[#A9D9C7] p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#614FBB]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#614FBB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2">Check your email</h2>
            <p className="text-[#A9D9C7] mb-6">
              We&apos;ve sent a confirmation link to <strong className="text-[#F2F2F2]">{email}</strong>
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-[#A9D9C7] text-[#1B4034] font-bold hover:bg-white transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B4034] flex items-center justify-center p-6 page-ambient">
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Create Account</h1>
          <p className="text-[#A9D9C7]">Let's start a new chapter with Kibo</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="bg-[#1B4034] border border-[#A9D9C7] p-6 rounded-xl shadow-lg">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#A9D9C7] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#1B4032] border border-[#A9D9C7]/30
                           text-[#F2F2F2] placeholder:text-[#F2F2F2]/30
                           focus:border-[#A9D9C7] focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#A9D9C7] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#1B4032] border border-[#A9D9C7]/30
                           text-[#F2F2F2] placeholder:text-[#F2F2F2]/30
                           focus:border-[#A9D9C7] focus:outline-none transition-colors"
              />
            </div>

            {/* Confirm Password */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#A9D9C7] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#1B4032] border border-[#A9D9C7]/30
                           text-[#F2F2F2] placeholder:text-[#F2F2F2]/30
                           focus:border-[#A9D9C7] focus:outline-none transition-colors"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mt-4 rounded-lg bg-[#C24656]/10 border border-[#C24656]/30">
                <p className="text-sm text-[#C24656]">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-200
                ${loading
                  ? 'bg-[#A9D9C7]/50 text-[#1B4034] cursor-not-allowed'
                  : 'bg-[#A9D9C7] text-[#1B4034] hover:bg-white hover:shadow-[0_0_20px_rgba(169,217,199,0.3)]'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <p className="text-center text-[#A9D9C7]/70 mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#A9D9C7] hover:text-white transition-colors font-bold"
          >
            Sign in
          </Link>
        </p>

        {/* Back to Home */}
        <p className="text-center mt-4">
          <Link
            href="/"
            className="text-[#F2F2F2]/50 hover:text-[#F2F2F2] text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
