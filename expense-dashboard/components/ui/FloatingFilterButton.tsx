'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface FloatingFilterButtonProps {
  onClick: () => void;
  count: number;
  isOpen?: boolean;
}

export default function FloatingFilterButton({ onClick, count, isOpen = false }: FloatingFilterButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Colors: When closed - dark bg with Teal icon. When open - Teal bg with dark icon
  const bgColor = isOpen ? 'var(--color-total)' : 'var(--color-kibo-bg)';
  const iconColor = isOpen ? 'var(--color-kibo-bg)' : 'var(--color-total)';
  const borderColor = isOpen ? 'rgba(255,255,255,0.3)' : 'var(--color-total)';
  const shadowColor = isOpen ? 'var(--color-total)' : 'rgba(169, 217, 199, 0.3)'; // Teal-ish shadow

  const buttonContent = (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '120px',
        right: '24px',
        zIndex: 9998,
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: bgColor,
        color: iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${borderColor}`,
        cursor: 'pointer',
        transition: 'transform 0.1s ease',
      }}
      aria-label="Toggle Filters"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {isOpen ? (
          // X icon when open
          <>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </>
        ) : (
          // Filter icon when closed
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        )}
      </svg>
      {count > 0 && !isOpen && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-present)', // Use Present Red for badge
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--color-kibo-bg)',
        }}>
          {count}
        </span>
      )}
    </button>
  );

  if (!mounted) return null;

  return createPortal(buttonContent, document.body);
}

