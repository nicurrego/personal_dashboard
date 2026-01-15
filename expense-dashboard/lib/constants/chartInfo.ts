/**
 * Chart Information Dictionary
 * Contains titles and descriptions for the Info Modal system.
 */

export const CHART_INFO = {
  monthly: {
    title: 'Monthly Spending Trend',
    description: 'Tracks your total spending over time compared to previous months.\n\nThe colored lines break down spending to help you visualize your balance:\n• Living (Cyan): Essential needs.\n• Present (Amber): Wants and short-term enjoyment.\n• Future (Green): Savings and investments.'
  },
  burn: {
    title: 'Burn Rate Gauge',
    description: 'A speedometer for your budget.\n\n• Blue Arc: How much of the month has passed.\n• Colored Arc: How much budget you have used.\n\nIf the colored arc is longer than the blue one, you are "Burning Fast" (spending faster than time is passing).'
  },
  donut: {
    title: 'Target Distribution',
    description: 'See the balance of your financial life. Ideally, you might aim for a 50/30/20 split:\n\n• 50% Living (Needs)\n• 30% Present (Wants)\n• 20% Future (Savings)\n\nThis donut chart shows your actual current split.'
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
    title: 'Spending Heatmap (Daily)',
    description: 'A calendar view of your spending habits.\n\n• Rows: Days of the week (Sun to Sat).\n• Columns: Weeks of the year.\n• Intensity: Brighter/Pinker cells mean higher spending on that specific day.\n\n💡 Ways to use this chart:\n1. Single Month: See exactly which days you splurged.\n2. One Category: Track habits (e.g., "Do I buy coffee every Tuesday?").\n3. Current Year: Get a bird\'s-eye view of your entire year\'s density.\n4. Location: See if specific places trigger spending streaks.\n5. Living vs. Wants: Filter by Target to see if "Needs" are consistent vs. erratic "Wants".'
  }
} as const;

export type ChartKey = keyof typeof CHART_INFO;
