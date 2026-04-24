import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

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

interface SliderInputProps {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
}

function SliderInput({ id, label, prefix, suffix, min, max, step, value, onChange, minLabel, maxLabel }: SliderInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm text-muted-foreground shrink-0">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(isNaN(v) ? min : Math.max(min, Math.min(v, max)));
            }}
            className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-primary"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

interface NestEggResult {
  projectedTotal: number;
  totalContributions: number;
  interestEarned: number;
  monthlyIncome: number;
  contributionPct: number;
  interestPct: number;
}

function calculateNestEgg(
  currentSavings: number,
  monthlyContribution: number,
  years: number,
  returnRate: number
): NestEggResult {
  const r = returnRate;
  const n = years;

  // FV of current lump sum: PV * (1+r)^n
  const fvCurrent = currentSavings * Math.pow(1 + r, n);

  // FV of monthly annuity: PMT * ((1+r/12)^(n*12) - 1) / (r/12)
  const monthlyRate = r / 12;
  const totalMonths = n * 12;
  const fvContributions = monthlyRate > 0
    ? monthlyContribution * (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate
    : monthlyContribution * totalMonths;

  const projectedTotal = fvCurrent + fvContributions;
  const totalContributions = currentSavings + monthlyContribution * 12 * n;
  const interestEarned = projectedTotal - totalContributions;
  const monthlyIncome = projectedTotal * 0.04 / 12;

  const contributionPct = projectedTotal > 0 ? (totalContributions / projectedTotal) * 100 : 0;
  const interestPct = projectedTotal > 0 ? (interestEarned / projectedTotal) * 100 : 0;

  return {
    projectedTotal,
    totalContributions,
    interestEarned,
    monthlyIncome,
    contributionPct,
    interestPct,
  };
}

export default function NestEggCalculator() {
  const [currentSavings, setCurrentSavings] = useState(25_000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(30);
  const [returnRate, setReturnRate] = useState(0.07);

  const result = useMemo(
    () => calculateNestEgg(currentSavings, monthlyContribution, years, returnRate),
    [currentSavings, monthlyContribution, years, returnRate]
  );

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Nest Egg Calculator</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Project your retirement savings based on current balance, monthly contributions, and expected returns.
        </p>
        <div className="space-y-4">
          <SliderInput
            id="nest-current"
            label="Current Savings"
            prefix="$"
            min={0}
            max={1_000_000}
            step={5000}
            value={currentSavings}
            onChange={setCurrentSavings}
            minLabel="$0"
            maxLabel="$1M"
          />
          <SliderInput
            id="nest-monthly"
            label="Monthly Contribution"
            prefix="$"
            min={0}
            max={5000}
            step={50}
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            minLabel="$0"
            maxLabel="$5,000"
          />
          <SliderInput
            id="nest-years"
            label="Years to Retirement"
            min={1}
            max={45}
            step={1}
            value={years}
            onChange={setYears}
            minLabel="1"
            maxLabel="45"
          />
          <SliderInput
            id="nest-return"
            label="Expected Annual Return"
            suffix="%"
            min={0}
            max={0.15}
            step={0.005}
            value={returnRate}
            onChange={setReturnRate}
            minLabel="0%"
            maxLabel="15%"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Projected Total" value={fmt$(result.projectedTotal)} highlight />
        <StatCard label="Total Contributions" value={fmt$(result.totalContributions)} />
        <StatCard label="Interest Earned" value={fmt$(result.interestEarned)} />
        <StatCard label="Est. Monthly Income" value={fmt$(result.monthlyIncome)} />
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Savings composition</p>
        <div className="flex h-3.5 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${result.contributionPct}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${result.interestPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 size-2.5 rounded-sm bg-teal-500" />
            <span className="text-xs text-muted-foreground">
              Contributions {fmtPct(result.contributionPct / 100)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 size-2.5 rounded-sm bg-amber-500" />
            <span className="text-xs text-muted-foreground">
              Interest {fmtPct(result.interestPct / 100)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your estimated monthly retirement income of{" "}
          <strong className="text-foreground">{fmt$(result.monthlyIncome)}</strong> is based on the 4% safe withdrawal
          rule. This assumes a 30-year retirement with a balanced portfolio. For longer retirements or more
          conservative planning, use a 3–3.5% rate instead.
        </p>
      </div>
    </div>
  );
}
