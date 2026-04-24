import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  CalculatorContainer, 
  CalculatorHeader, 
  StatCard, 
  StatsGrid, 
  InfoBox 
} from "@/components/ui/calculator-layouts";

const MAX_GOAL = 500_000;
const DEFAULT_GOAL = 10_000;
const DEFAULT_CURRENT = 2_000;
const DEFAULT_MONTHLY = 300;
const DEFAULT_RATE = 4.5;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function projectMonths(
  goal: number,
  current: number,
  monthly: number,
  annualRate: number
): { months: number; finalBalance: number; onTrack: boolean; shortfall: number } {
  if (goal <= 0) return { months: 0, finalBalance: 0, onTrack: true, shortfall: 0 };
  if (current >= goal) return { months: 0, finalBalance: current, onTrack: true, shortfall: 0 };
  if (monthly <= 0 && annualRate <= 0) {
    return { months: Infinity, finalBalance: current, onTrack: false, shortfall: goal - current };
  }

  const monthlyRate = annualRate / 100 / 12;
  let balance = current;
  let months = 0;
  const maxMonths = 600;

  while (balance < goal && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthly;
    months++;
  }

  const onTrack = balance >= goal;
  const shortfall = onTrack ? 0 : goal - balance;

  return { months, finalBalance: balance, onTrack, shortfall };
}

export default function SavingsGoalTracker() {
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [current, setCurrent] = useState(DEFAULT_CURRENT);
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [rate, setRate] = useState(DEFAULT_RATE);

  const result = useMemo(
    () => projectMonths(goal, current, monthly, rate),
    [goal, current, monthly, rate]
  );

  const progressPct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const remaining = Math.max(0, goal - current);

  return (
    <CalculatorContainer variant="default">
      <CalculatorHeader 
        variant="default"
        title="Savings Goal Tracker" 
      />

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="sg-goal" className="text-sm text-muted-foreground shrink-0">
              Goal Amount
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="sg-goal"
                type="number"
                min={0}
                max={MAX_GOAL}
                step={500}
                value={goal}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setGoal(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_GOAL)));
                }}
                className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_GOAL}
            step={500}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Savings goal amount"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$500,000</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="sg-current" className="text-sm text-muted-foreground shrink-0">
              Current Savings
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="sg-current"
                type="number"
                min={0}
                max={MAX_GOAL}
                step={100}
                value={current}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setCurrent(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_GOAL)));
                }}
                className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="sg-monthly" className="text-sm text-muted-foreground shrink-0">
              Monthly Contribution
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="sg-monthly"
                type="number"
                min={0}
                max={50_000}
                step={50}
                value={monthly}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setMonthly(isNaN(v) ? 0 : Math.max(0, Math.min(v, 50_000)));
                }}
                className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="sg-rate" className="text-sm text-muted-foreground shrink-0">
              Annual Interest Rate
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="sg-rate"
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={rate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setRate(isNaN(v) ? 0 : Math.max(0, Math.min(v, 20)));
                }}
                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Annual interest rate"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>20%</span>
          </div>
        </div>
      </div>

      <StatsGrid cols={4} variant="default">
        <StatCard variant="default" label="Current" value={fmt$(current)} />
        <StatCard variant="default" label="Remaining" value={fmt$(remaining)} />
        <StatCard
          variant="default"
          label="Months to Goal"
          value={
            result.months === Infinity
              ? "Never"
              : result.months >= 600
                ? "50yr+"
                : `${result.months} mo`
          }
          highlight
        />
        <StatCard
          variant="default"
          label="Status"
          value={current >= goal ? "Reached!" : result.onTrack ? "On track" : "Shortfall"}
          highlight={result.onTrack || current >= goal}
        />
      </StatsGrid>

      {goal > 0 && (
        <div className="rounded-lg bg-background p-4 space-y-3 border border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Progress</p>
            <span className="font-heading text-lg font-bold tabular-nums text-primary">
              {progressPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                current >= goal ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{fmt$(current)}</span>
            <span>{fmt$(goal)}</span>
          </div>
        </div>
      )}

      {goal > 0 && current < goal && (
        <div className="rounded-lg bg-muted/30 border border-border/30 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projection</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly contribution</span>
              <span className="font-heading font-medium tabular-nums">{fmt$(monthly)}/mo</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interest earned (est.)</span>
              <span className="font-heading font-medium tabular-nums">
                {rate > 0 ? `${rate.toFixed(1)}% APY` : "None"}
              </span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">Projected balance</span>
              <span className="font-heading font-semibold tabular-nums">
                {result.months < 600 ? fmt$(result.finalBalance) : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {goal > 0 && current < goal && !result.onTrack && result.shortfall > 0 && (
        <InfoBox type="error" variant="default">
          At this rate, you'll fall <strong className="text-foreground">{fmt$(result.shortfall)}</strong> short of your goal after 50 years. Increase your monthly contribution or adjust your goal to get on track.
        </InfoBox>
      )}

      {goal > 0 && current < goal && result.onTrack && (
        <InfoBox type="default" variant="default">
          You're <strong className="text-foreground">on track</strong> to reach your goal in <strong className="text-foreground">{result.months} month{result.months !== 1 ? "s" : ""}</strong>. {rate > 0 && ` Interest will help you get there ${Math.round((1 - result.months / (goal > 0 && monthly > 0 ? Math.ceil(remaining / monthly) : result.months)) * 100) > 0 ? "faster" : "steadily"}.`}
        </InfoBox>
      )}

      {goal > 0 && current >= goal && (
        <InfoBox type="success" variant="default">
          <strong className="text-foreground">Goal reached!</strong> You've already hit your savings target. Consider setting a new goal or redirecting contributions toward investing.
        </InfoBox>
      )}
    </CalculatorContainer>
  );
}
