/**
 * Components Barrel Export
 * 
 * Central export for all components in the application.
 * 
 * Usage:
 * - For UI primitives: import { Button, Card } from '@/components/ui';
 * - For feature components: import { MainDashboard } from '@/components';
 * - For charts: import { SpendingTrendD3 } from '@/components/charts';
 */

// Re-export all UI components
export * from './ui';

// Re-export chart components
export * from './charts';

// Re-export filter components
export * from './filters';

// Re-export layout components
export * from './layout';

// Re-export quick entry components
export * from './quick-entry';

// Re-export onboarding components
export * from './onboarding';

// Re-export dashboard components
export * from './dashboard';

// Re-export expenses components
export * from './expenses';

// Re-export page-level components
export { default as MainDashboard } from './MainDashboard';
export { default as KPICards } from './KPICards';
export { default as TransactionTable } from './TransactionTable';

// Re-export context providers
export { HeaderProvider, useHeader } from './header-context';
export { default as PageTitle } from './page-title';

// Re-export providers
export * from './providers';

