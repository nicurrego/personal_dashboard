'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ExpandedChartOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * Fullscreen overlay for expanded chart views.
 * Rotates content 90 degrees for landscape viewing on mobile.
 */
export default function ExpandedChartOverlay({ children, onClose }: ExpandedChartOverlayProps) {
  const [showControls, setShowControls] = useState(true);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div 
      onClick={() => setShowControls(prev => !prev)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close Button - Toggleable */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          zIndex: 100001,
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'opacity 0.3s ease, transform 0.2s ease',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
        }}
        aria-label="Close expanded view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Rotated Container for Landscape View on Mobile */}
      <div
        style={{
          width: 'calc(100vh - 160px)', 
          height: '100vw',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(90deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
