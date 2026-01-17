import type { BudgetTotals } from '../../types';

export type ChartType = 'DONUT' | 'SANKEY' | 'PROJECTION' | 'TREEMAP' | 'COMPARISON';

export interface ChartProps {
  totals: BudgetTotals;
  size: 'small' | 'large';
  monthlyNetCashFlow?: number;
}

export interface ChartDefinition {
  id: ChartType;
  title: string;
  description: string;
}

export const CHART_DEFINITIONS: ChartDefinition[] = [
  {
    id: 'DONUT',
    title: 'Allocation Split',
    description: 'See how your budget is distributed across Future, Living, and Present buckets.',
  },
  {
    id: 'SANKEY',
    title: 'Money Flow',
    description: 'Visualize how income flows into your three main spending buckets.',
  },
  {
    id: 'PROJECTION',
    title: 'Savings Forecast',
    description: 'Project your cumulative savings over the next 12 months.',
  },
  {
    id: 'TREEMAP',
    title: 'Spending Map',
    description: 'Identify your biggest budget categories at a glance.',
  },
  {
    id: 'COMPARISON',
    title: 'Income vs Expenses',
    description: 'Compare your total income against planned expenses.',
  },
];
