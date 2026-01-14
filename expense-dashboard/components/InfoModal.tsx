'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export default function InfoModal({ isOpen, onClose, title, description }: InfoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow render before transition
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        // Wait for animation to finish before unmounting (handled by parent conditional usually, 
        // but if parent keeps it mounted, this works. If parent unmounts, this effect cleanup runs)
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  // We strictly use Portal to ensure it overlays everything
  return createPortal(
    <div 
      className={`fixed inset-0 z-[100000] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-sm bg-void-black/90 border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all duration-300 ${
          visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        style={{
          boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
        }}
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl opacity-50 -z-10 rounded-2xl" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          {title}
        </h3>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
          {description}
        </p>

        {/* Footer */}
        <button 
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white font-medium text-sm transition-all active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body
  );
}
