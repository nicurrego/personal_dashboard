'use client';

import React from 'react';

interface ExitConfirmationModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
}

export function ExitConfirmationModal({
    isOpen,
    onCancel,
    onConfirm,
    title = 'Unsaved Changes',
    message = 'You have unsaved changes. Leaving now will discard them.',
    cancelText = 'Keep Editing',
    confirmText = 'Discard & Leave'
}: ExitConfirmationModalProps) {
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

                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-[#A9D9C7] text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="w-full grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="w-full py-3 rounded-xl font-semibold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 rounded-xl font-semibold bg-[#C24656] text-white hover:bg-[#A63643] transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
