/**
 * Chart Information Dictionary
 * Contains titles and descriptions for the Info Modal system.
 */

export const CHART_INFO = {
  monthly: {
    title: 'Monthly Spending Trend',
    description: 'Tracks your total spending over time compared to previous months.\n\nThe colored lines break down spending to help you visualize your balance:\n• Living (Blue): Essential needs.\n• Present (Red): Wants and short-term enjoyment.\n• Future (Purple): Savings and investments.'
  },
  burn: {
    title: 'Burn Rate Gauge',
    description: 'A speedometer for your budget.\n\n• Teal Arc: Reference for how much of the month has passed.\n• Inner Arc: How much budget you have actually used.\n\n If the inner arc passes the teal line, you are "Burning Fast" and spending ahead of schedule.'
  },
  donut: {
    title: 'Target Distribution',
    description: 'See the balance of your financial life. Aim for your ideal split:\n\n• Living (Blue): Needs (Rent, Groceries)\n• Present (Red): Wants (Dining, Fun)\n• Future (Purple): Savings (Investments)\n\nThis donut chart shows your actual current split.'
  },
  bar: {
    title: 'Top Categories',
    description: 'Your biggest money sinks.\n\nThis bar chart ranks your expenses by category so you can instantly spot what is eating up your budget—whether it is Housing, Food, or Entertainment.'
  },
  dayOfWeek: {
    title: 'Day of Week Analysis',
    description: 'Discover your weekly spending rhythm.\n\n• Bars show total spending for each day (Sun-Sat).\n• Use this to identify if you tend to overspend on weekends or specific weekdays.'
  },
  topShops: {
    title: 'Top Shops',
    description: 'Your most frequented merchants.\n\n• Bars represent total spending at each shop.\n• Identifies where your money goes most often (e.g., specific supermarkets, cafes, or subscriptions).'
  },
  heatmap: {
    title: 'Spending Heatmap',
    description: 'A calendar view of your spending intensity.\n\n• Rows: Days of the week.\n• Columns: Weeks of the year.\n• Intensity: Brighter Teal cells mean higher spending on that specific day.\n\nUse this to spot recurring habits, specific "spend-heavy" days, or seasonal patterns.'
  }
} as const;

export type ChartKey = keyof typeof CHART_INFO;
