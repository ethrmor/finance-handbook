import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  CalculatorContainer, 
  CalculatorHeader, 
  StatCard, 
  StatsGrid, 
  InfoBox 
} from "@/components/ui/calculator-layouts";

const CATEGORIES = [
  {
    key: "needs" as const,
    label: "Needs",
    pct: 0.5,
    fill: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    description: "Rent, groceries, utilities, insurance, minimum debt payments",
  },
  {
    key: "wants" as const,
    label: "Wants",
    pct: 0.3,
    fill: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
    description: "Dining out, entertainment, hobbies, travel",
  },
  {
    key: "savings" as const,
    label: "Savings & Debt Payoff",
    pct: 0.2,
    fill: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    description: "Emergency fund, extra debt payments, retirement contributions",
  },
];

const MAX_INCOME = 25_000;
const DEFAULT_INCOME = 8_000;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function FiftyThirtyTwentyCalculator() {
  const [income, setIncome] = useState(DEFAULT_INCOME);

  const allocations = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        amount: income * cat.pct,
      })),
    [income]
  );

  return (
    <CalculatorContainer variant="elevated">
      <CalculatorHeader 
        variant="elevated"
        title="50/30/20 Rule Calculator" 
        description="A simple framework for budgeting: 50% needs, 30% wants, 20% savings."
      />

      <div className="rounded-xl bg-background/80 border border-border/50 p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="ftt-income" className="text-sm font-medium text-foreground shrink-0">
            Monthly Net Income
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="ftt-income"
              type="number"
              min={0}
              max={MAX_INCOME}
              step={50}
              value={income}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setIncome(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_INCOME)));
              }}
              className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-base font-heading font-semibold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-inner"
            />
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={MAX_INCOME}
          step={50}
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          className="w-full cursor-pointer accent-primary h-2 rounded-full"
          aria-label="Monthly net income"
        />

        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>$0</span>
          <span>$25,000</span>
        </div>
      </div>

      <StatsGrid cols={3} variant="elevated">
        {allocations.map((cat) => (
          <StatCard
            key={cat.key}
            variant="elevated"
            label={`${cat.label} (${(cat.pct * 100).toFixed(0)}%)`}
            value={fmt$(cat.amount)}
            highlight={cat.key === "savings"}
          />
        ))}
      </StatsGrid>

      {income > 0 && (
        <div className="rounded-xl bg-background/60 border border-border/40 p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Income allocation</p>
          <div className="flex h-5 rounded-full overflow-hidden bg-muted shadow-inner">
            {allocations.map((cat) => (
              <div
                key={cat.key}
                className={cn(cat.fill, "h-full transition-all duration-300 shadow-sm")}
                style={{ width: `${cat.pct * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {allocations.map((cat) => (
              <span key={cat.key} className={cn("text-sm font-bold", cat.text)}>
                {(cat.pct * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category Breakdown</p>
        {allocations.map((cat) => (
          <div key={cat.key} className="rounded-xl bg-background/60 border border-border/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("shrink-0 size-4 rounded-md shadow-sm", cat.dot)} />
                <span className={cn("font-heading text-base font-bold shrink-0", cat.text)}>
                  {cat.label}
                </span>
              </div>
              <span className={cn("font-heading text-lg font-bold tabular-nums shrink-0", cat.text)}>
                {fmt$(cat.amount)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">{cat.description}</p>
          </div>
        ))}
      </div>

      {income > 0 && (
        <InfoBox variant="elevated" type="default">
          These percentages are <strong className="text-foreground">guidelines, not commandments</strong>. If your needs exceed 50%, adjust wants and savings accordingly. The goal is intentional allocation—not hitting an exact number.
        </InfoBox>
      )}
    </CalculatorContainer>
  );
}
