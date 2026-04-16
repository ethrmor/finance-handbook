import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const BRACKETS_2025_SINGLE = [
  { rate: 0.1, max: 11_925 },
  { rate: 0.12, max: 48_475 },
  { rate: 0.22, max: 103_350 },
  { rate: 0.24, max: 197_300 },
  { rate: 0.32, max: 250_525 },
  { rate: 0.35, max: 626_350 },
  { rate: 0.37, max: Infinity },
];

const DISPLAY_RANGES: { min: number; max: number }[] = [
  { min: 0, max: 11_925 },
  { min: 11_926, max: 48_475 },
  { min: 48_476, max: 103_350 },
  { min: 103_351, max: 197_300 },
  { min: 197_301, max: 250_525 },
  { min: 250_526, max: 626_350 },
  { min: 626_351, max: Infinity },
];

const BRACKET_COLORS = [
  { fill: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  { fill: "bg-teal-500", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-500" },
  { fill: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  { fill: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  { fill: "bg-orange-500", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  { fill: "bg-red-500", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  { fill: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
];

const MAX_INCOME = 750_000;
const DEFAULT_INCOME = 55_000;
const LAST_BRACKET_VISUAL_CAP = 750_000;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function fmtRange(min: number, max: number): string {
  return max === Infinity ? `${fmt$(min)}+` : `${fmt$(min)} – ${fmt$(max)}`;
}

interface BracketResult {
  rate: number;
  label: string;
  displayMin: number;
  displayMax: number;
  amountInBracket: number;
  taxInBracket: number;
  fillPct: number;
  color: (typeof BRACKET_COLORS)[number];
  active: boolean;
}

function calculateTax(income: number) {
  let prevMax = 0;
  let totalTax = 0;
  let marginalRate = 0;
  const brackets: BracketResult[] = [];

  for (let i = 0; i < BRACKETS_2025_SINGLE.length; i++) {
    const b = BRACKETS_2025_SINGLE[i];
    const color = BRACKET_COLORS[i];
    const display = DISPLAY_RANGES[i];

    const amountInBracket = Math.max(0, Math.min(income, b.max) - prevMax);
    const taxInBracket = amountInBracket * b.rate;
    totalTax += taxInBracket;

    const active = amountInBracket > 0;
    if (active) marginalRate = b.rate;

    const visualMax = b.max === Infinity ? LAST_BRACKET_VISUAL_CAP : b.max;
    const bracketSpan = visualMax - prevMax;
    const fillPct = bracketSpan > 0 ? Math.min(100, (amountInBracket / bracketSpan) * 100) : 0;

    brackets.push({
      rate: b.rate,
      label: `${(b.rate * 100).toFixed(0)}%`,
      displayMin: display.min,
      displayMax: display.max,
      amountInBracket,
      taxInBracket,
      fillPct,
      color,
      active,
    });

    prevMax = b.max === Infinity ? LAST_BRACKET_VISUAL_CAP : b.max;
  }

  return {
    brackets,
    totalTax,
    effectiveRate: income > 0 ? totalTax / income : 0,
    marginalRate,
    takeHome: income - totalTax,
  };
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

export default function TaxBracketVisualizer() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const result = useMemo(() => calculateTax(income), [income]);
  const activeBrackets = result.brackets.filter((b) => b.amountInBracket > 0);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Tax Bracket Visualizer</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="tax-income" className="text-sm text-muted-foreground shrink-0">
              Annual Income
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="tax-income"
                type="number"
                min={0}
                max={MAX_INCOME}
                step={500}
                value={income}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setIncome(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_INCOME)));
                }}
                className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={MAX_INCOME}
            step={500}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Annual income"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$750,000</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Tax" value={fmt$(result.totalTax)} />
        <StatCard label="Effective Rate" value={fmtPct(result.effectiveRate)} highlight />
        <StatCard
          label="Marginal Rate"
          value={result.marginalRate > 0 ? `${(result.marginalRate * 100).toFixed(0)}%` : "—"}
        />
        <StatCard label="Take-Home" value={fmt$(result.takeHome)} />
      </div>

      {income > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            Income distribution across brackets
          </p>
          <div className="flex h-3.5 rounded-full overflow-hidden bg-muted">
            {activeBrackets.map((b, i) => (
              <div
                key={i}
                className={cn(b.color.fill, "h-full transition-all duration-300")}
                style={{ width: `${(b.amountInBracket / income) * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Bracket Breakdown</p>
        {result.brackets.map((b, i) => (
          <div
            key={i}
            className={cn(
              "rounded-md p-3 transition-opacity duration-200",
              b.active ? "opacity-100" : "opacity-30"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("shrink-0 size-2.5 rounded-sm", b.color.dot)} />
                <span
                  className={cn(
                    "font-heading text-sm font-medium shrink-0",
                    b.active ? b.color.text : "text-muted-foreground"
                  )}
                >
                  {b.label}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {fmtRange(b.displayMin, b.displayMax)}
                </span>
              </div>
              {b.active && (
                <div className="flex items-center gap-3 text-xs shrink-0 pl-2">
                  <span className="text-muted-foreground tabular-nums">
                    {fmt$(b.amountInBracket)}
                  </span>
                  <span className={cn("font-medium tabular-nums", b.color.text)}>
                    {fmt$(b.taxInBracket)}
                  </span>
                </div>
              )}
            </div>

            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(b.color.fill, "h-full rounded-full transition-all duration-300")}
                style={{ width: `${b.fillPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {income > 0 && result.marginalRate > result.effectiveRate && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your <strong className="text-foreground">effective rate</strong> (
            {fmtPct(result.effectiveRate)}) is always lower than your{" "}
            <strong className="text-foreground">marginal rate</strong> (
            {(result.marginalRate * 100).toFixed(0)}%) because only the dollars in each bucket are
            taxed at that rate. Moving into a higher bracket doesn&apos;t change the rate on income
            in lower brackets.
          </p>
        </div>
      )}
    </div>
  );
}
