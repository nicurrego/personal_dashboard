'use client';

import React from 'react';

interface SuccessAnimationProps {
  onComplete?: () => void;
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  React.useEffect(() => {
    // Trigger completion callback after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B4034]/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out_forwards]">
        {/* Animated checkmark */}
        <div className="relative">
          {/* Outer ring with ping - Teal */}
          <div
            className="w-32 h-32 rounded-full border-4 border-cyber-cyan"
            style={{
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) forwards'
            }}
          />

          {/* Inner circle with checkmark - Teal bg */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-full bg-cyber-cyan/20 
                         flex items-center justify-center"
              style={{
                animation: 'scaleIn 0.4s ease-out 0.2s forwards',
                transform: 'scale(0)'
              }}
            >
              <svg
                className="w-12 h-12 text-cyber-cyan"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100,
                    animation: 'drawCheck 0.5s ease-out 0.6s forwards'
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Success text */}
        <div
          className="text-center"
          style={{
            animation: 'fadeUp 0.4s ease-out 0.5s forwards',
            opacity: 0
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            Transaction Saved!
          </h2>
          <p className="text-[#A9D9C7]">
            Added to your expense log
          </p>
        </div>
      </div>

      {/* Inline keyframes using a style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes drawCheck {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}} />
    </div>
  );
}
