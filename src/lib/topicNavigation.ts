export const allTopics = [
  { title: "Budgeting & Saving", href: "/topics/budgeting-and-saving" },
  { title: "Emergency Funds", href: "/topics/emergency-funds" },
  { title: "Debt Management", href: "/topics/debt-management" },
  { title: "Banking Basics", href: "/topics/banking-basics" },
  { title: "Income Optimization", href: "/topics/income-optimization" },
  { title: "Spending Psychology", href: "/topics/spending-psychology" },
  { title: "Credit Scores", href: "/topics/credit-scores" },
  { title: "Investing 101", href: "/topics/investing-101" },
  { title: "Retirement Planning", href: "/topics/retirement-planning" },
  { title: "Advanced Investing", href: "/topics/advanced-investing" },
  { title: "Side Income & Business", href: "/topics/side-income" },
  { title: "Housing Decisions", href: "/topics/housing-decisions" },
  { title: "Relationships & Money", href: "/topics/relationships-and-money" },
  { title: "Having Kids", href: "/topics/having-kids" },
  { title: "Major Purchases", href: "/topics/major-purchases" },
  { title: "Insurance", href: "/topics/insurance" },
  { title: "Taxes Simplified", href: "/topics/taxes-simplified" },
  { title: "Estate Planning", href: "/topics/estate-planning" },
  { title: "Fraud & Identity Theft", href: "/topics/fraud-and-identity-theft" },
  { title: "Job Loss Survival", href: "/topics/job-loss-survival" },
  { title: "Money & Mental Health", href: "/topics/money-and-mental-health" },
  { title: "Values-Based Spending", href: "/topics/values-based-spending" },
]

export function getNextTopic(currentPath: string): { title: string; href: string } | null {
  const currentIndex = allTopics.findIndex(topic => topic.href === currentPath)
  if (currentIndex === -1 || currentIndex === allTopics.length - 1) {
    return null
  }
  return allTopics[currentIndex + 1]
}

export function getPrevTopic(currentPath: string): { title: string; href: string } | null {
  const currentIndex = allTopics.findIndex(topic => topic.href === currentPath)
  if (currentIndex <= 0) {
    return null
  }
  return allTopics[currentIndex - 1]
}
