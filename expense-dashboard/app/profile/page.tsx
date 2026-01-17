'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  display_name: string;
  email: string;
  currency: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('¥');
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

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
      setCurrency(profileData.currency || '¥');
    }
    
    setLoading(false);
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
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="text-secondary-text hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-white">Profile Settings</h1>
          <div className="w-24" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-growth-green/10 border-growth-green/30 text-growth-green'
              : 'bg-laser-magenta/10 border-laser-magenta/30 text-laser-magenta'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Info */}
        <div className="liquid-card p-6 space-y-4">
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
                         text-white focus:border-cyber-cyan focus:outline-none transition-colors"
            >
              <option value="¥">¥ (Yen)</option>
              <option value="$">$ (Dollar)</option>
              <option value="€">€ (Euro)</option>
              <option value="£">£ (Pound)</option>
              <option value="₩">₩ (Won)</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold
                       bg-gradient-to-r from-cyber-cyan to-growth-green text-white
                       hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="liquid-card p-6 space-y-4">
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
                           bg-alert-amber text-black
                           hover:bg-alert-amber/90 transition-all"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="liquid-card p-6">
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
        <div className="liquid-card p-6 space-y-4 border-laser-magenta/30">
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
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-laser-magenta/50
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
  );
}
