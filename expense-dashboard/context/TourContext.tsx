'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface TourStep {
    path: string;
    label: string;
    description?: string;
}

const TOUR_STEPS: TourStep[] = [
    { path: '/tour/home', label: 'Welcome to Kibo', description: 'This is a guided tour to help you understand how to track your wealth.' },
    { path: '/tour/home', label: 'Home Page', description: 'See your financial health, investment progress, and available budget at a glance.' },
    { path: '/tour/budget', label: 'Budget Overview', description: 'Track your spending against your targets for Income, Future, Living, and Present.' },
    { path: '/tour/budget/builder', label: 'Budget Builder', description: 'Plan your monthly budget easily with our drag-and-drop tool or inputs.' },
    { path: '/tour/budget', label: 'Recent Transactions', description: 'See your latest spending right on the budget page.' },

    { path: '/tour/dashboard', label: 'Dashboard Analytics', description: 'Deep dive into your spending trends, burn rate, and category breakdowns.' },
    { path: '/tour/quick-entry', label: 'Quick Entry', description: 'Log expenses instantly on the go with our mobile-first interface.' },
    { path: '/home', label: 'Finished!', description: 'You are ready to start! create an account to begin.' },
];

interface TourContextType {
    isTourActive: boolean;
    currentStepIndex: number;
    startTour: () => void;
    endTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    currentStep: TourStep | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    // Reset tour on mount if user lands on /tour without active tour
    useEffect(() => {
        if (pathname?.startsWith('/tour') && !isTourActive) {
            router.replace('/');
        }
    }, [pathname, isTourActive, router]);

    const startTour = useCallback(() => {
        setIsTourActive(true);
        setCurrentStepIndex(0);
        router.push('/tour/home');
    }, [router]);

    const endTour = useCallback(() => {
        setIsTourActive(false);
        setCurrentStepIndex(0);
        router.push('/');
    }, [router]);

    const nextStep = useCallback(() => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            const nextPath = TOUR_STEPS[nextIndex].path;
            if (nextPath !== pathname) {
                router.push(nextPath);
            }
        } else {
            endTour();
        }
    }, [currentStepIndex, router, pathname, endTour]);

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevIndex);
            const prevPath = TOUR_STEPS[prevIndex].path;
            if (prevPath !== pathname) {
                router.push(prevPath);
            }
        }
    }, [currentStepIndex, router, pathname]);

    // Disable Pull-to-Refresh on Mobile during tour
    useEffect(() => {
        if (isTourActive) {
            document.body.style.overscrollBehaviorY = 'none'; // Chrome/Modern
            return () => {
                document.body.style.overscrollBehaviorY = 'auto';
            };
        }
    }, [isTourActive]);

    const value = {
        isTourActive,
        currentStepIndex,
        startTour,
        endTour,
        nextStep,
        prevStep,
        currentStep: isTourActive ? TOUR_STEPS[currentStepIndex] : null,
    };

    return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}
