import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Stability = "stable" | "average" | "unstable";

const STABILITY_OPTIONS: { value: Stability; label: string; months: number; description: string }[] = [
  { value: "stable", label: "Stable", months: 3, description: "Government job, tenured position, steady contract" },
  { value: "average", label: "Average", months: 6, description: "Standard W-2 employment, moderate industry risk" },
  { value: "unstable", label: "Unstable", months: 9, description: "Freelance, commission-based, startup environment" },
];

const EARNER_MULTIPLIER: Record<number, number> = {
  1: 1,
  2: 0.75,
  3: 0.6,
  4: 0.5,
};

const MAX_EXPENSES = 20_000;
const DEFAULT_EXPENSES = 3_500;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-heading text-lg font-semibold tabular-nums",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function EmergencyFundCalculator() {
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [stability, setStability] = useState<Stability>("average");
  const [earners, setEarners] = useState(1);

  const result = useMemo(() => {
    const baseMonths = STABILITY_OPTIONS.find((o) => o.value === stability)?.months ?? 6;
    const multiplier = EARNER_MULTIPLIER[earners] ?? 1;
    const recommendedMonths = Math.round(baseMonths * multiplier);
    const target = expenses * recommendedMonths;
    return { recommendedMonths, target, baseMonths };
  }, [expenses, stability, earners]);

  const stabilityInfo = STABILITY_OPTIONS.find((o) => o.value === stability)!;

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Emergency Fund Calculator</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ef-expenses" className="text-sm text-muted-foreground shrink-0">
                Monthly Expenses
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  id="ef-expenses"
                  type="number"
                  min={0}
                  max={MAX_EXPENSES}
                  step={100}
                  value={expenses}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setExpenses(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_EXPENSES)));
                  }}
                  className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={MAX_EXPENSES}
              step={100}
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Monthly expenses"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>$20,000</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Job Stability</label>
            <div className="flex gap-2">
              {STABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStability(opt.value)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-heading font-medium transition-colors",
                    stability === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{stabilityInfo.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ef-earners" className="text-sm text-muted-foreground shrink-0">
                Income Earners
              </label>
              <input
                id="ef-earners"
                type="number"
                min={1}
                max={4}
                step={1}
                value={earners}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setEarners(isNaN(v) ? 1 : Math.max(1, Math.min(v, 4)));
                }}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              More earners = less risk per person. Multi-household incomes need smaller buffers per earner.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Recommended Months" value={`${result.recommendedMonths} mo`} highlight />
        <StatCard label="Monthly Expenses" value={fmt$(expenses)} />
        <StatCard label="Target Fund" value={fmt$(result.target)} highlight />
      </div>

      {expenses > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Target progress</p>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (result.recommendedMonths / 12) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0 months</span>
            <span>12 months</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">How the recommendation works</p>
        <div className="rounded-md p-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base ({stabilityInfo.label} job)</span>
            <span className="font-heading font-medium tabular-nums">{result.baseMonths} months</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Earner adjustment ({earners} earner{earners > 1 ? "s" : ""})</span>
            <span className="font-heading font-medium tabular-nums">×{EARNER_MULTIPLIER[earners]}</span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Recommended</span>
            <span className="font-heading font-semibold tabular-nums text-primary">
              {result.recommendedMonths} months = {fmt$(result.target)}
            </span>
          </div>
        </div>
      </div>

      {expenses > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Start with <strong className="text-foreground">one month of expenses</strong> as your initial
            target, then build toward the full recommendation. Even a partial fund prevents a single bad
            week from derailing your whole plan.
          </p>
        </div>
      )}
    </div>
  );
}
