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
            className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
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

interface ComparisonResult {
  traditionalBalance: number;
  traditionalAfterTax: number;
  rothBalance: number;
  rothAfterTax: number;
  taxPaidNowRoth: number;
  taxPaidLaterTraditional: number;
  winner: "traditional" | "roth" | "tie";
  advantage: number;
}

function calculateComparison(
  contribution: number,
  currentRate: number,
  retirementRate: number,
  years: number,
  returnRate: number
): ComparisonResult {
  const r = returnRate;
  const n = years;

  // Future value of annuity factor: ((1+r)^n - 1) / r
  const fvaFactor = r > 0 ? (Math.pow(1 + r, n) - 1) / r : n;

  // Traditional: full pre-tax contribution goes in, grows, then taxed on withdrawal
  const traditionalBalance = contribution * fvaFactor * (1 + r);
  const taxPaidLaterTraditional = traditionalBalance * retirementRate;
  const traditionalAfterTax = traditionalBalance * (1 - retirementRate);

  // Roth: after-tax contribution goes in, grows tax-free
  const afterTaxContribution = contribution * (1 - currentRate);
  const rothBalance = afterTaxContribution * fvaFactor * (1 + r);
  const taxPaidNowRoth = contribution * currentRate;
  const rothAfterTax = rothBalance;

  const diff = rothAfterTax - traditionalAfterTax;
  const winner = Math.abs(diff) < 1 ? "tie" : diff > 0 ? "roth" : "traditional";

  return {
    traditionalBalance,
    traditionalAfterTax,
    rothBalance,
    rothAfterTax,
    taxPaidNowRoth,
    taxPaidLaterTraditional,
    winner,
    advantage: Math.abs(diff),
  };
}

export default function RothVsTraditionalCalculator() {
  const [contribution, setContribution] = useState(7000);
  const [currentRate, setCurrentRate] = useState(0.24);
  const [retirementRate, setRetirementRate] = useState(0.15);
  const [years, setYears] = useState(30);
  const [returnRate, setReturnRate] = useState(0.07);

  const result = useMemo(
    () => calculateComparison(contribution, currentRate, retirementRate, years, returnRate),
    [contribution, currentRate, retirementRate, years, returnRate]
  );

  const maxAfterTax = Math.max(result.traditionalAfterTax, result.rothAfterTax, 1);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Roth vs Traditional Calculator</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Compare after-tax outcomes of pre-tax (Traditional) vs after-tax (Roth) contributions.
        </p>
        <div className="space-y-4">
          <SliderInput
            id="roth-contribution"
            label="Annual Contribution"
            prefix="$"
            min={0}
            max={23500}
            step={500}
            value={contribution}
            onChange={setContribution}
            minLabel="$0"
            maxLabel="$23,500"
          />
          <SliderInput
            id="roth-current-rate"
            label="Current Tax Rate"
            suffix="%"
            min={0}
            max={0.50}
            step={0.01}
            value={currentRate}
            onChange={setCurrentRate}
            minLabel="0%"
            maxLabel="50%"
          />
          <SliderInput
            id="roth-retirement-rate"
            label="Retirement Tax Rate"
            suffix="%"
            min={0}
            max={0.50}
            step={0.01}
            value={retirementRate}
            onChange={setRetirementRate}
            minLabel="0%"
            maxLabel="50%"
          />
          <SliderInput
            id="roth-years"
            label="Years Until Retirement"
            min={1}
            max={45}
            step={1}
            value={years}
            onChange={setYears}
            minLabel="1"
            maxLabel="45"
          />
          <SliderInput
            id="roth-return"
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
        <StatCard label="Traditional After-Tax" value={fmt$(result.traditionalAfterTax)} />
        <StatCard label="Roth After-Tax" value={fmt$(result.rothAfterTax)} highlight />
        <StatCard label="Tax Paid Now (Roth)" value={fmt$(result.taxPaidNowRoth)} />
        <StatCard label="Tax Paid Later (Trad)" value={fmt$(result.taxPaidLaterTraditional)} />
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">After-tax retirement value comparison</p>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-heading font-medium text-sky-700 dark:text-sky-400">Traditional</span>
              <span className="text-xs font-heading tabular-nums text-sky-700 dark:text-sky-400">
                {fmt$(result.traditionalAfterTax)}
              </span>
            </div>
            <div className="h-3.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-300"
                style={{ width: `${(result.traditionalAfterTax / maxAfterTax) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-heading font-medium text-emerald-700 dark:text-emerald-400">Roth</span>
              <span className="text-xs font-heading tabular-nums text-emerald-700 dark:text-emerald-400">
                {fmt$(result.rothAfterTax)}
              </span>
            </div>
            <div className="h-3.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(result.rothAfterTax / maxAfterTax) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border p-3",
          result.winner === "roth"
            ? "bg-emerald-500/5 border-emerald-500/10"
            : result.winner === "traditional"
              ? "bg-sky-500/5 border-sky-500/10"
              : "bg-primary/5 border-primary/10"
        )}
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          {result.winner === "roth" && (
            <>
              <strong className="text-emerald-700 dark:text-emerald-400">Roth wins</strong> by{" "}
              {fmt$(result.advantage)} because your retirement tax rate ({fmtPct(retirementRate)}) is lower than your
              current rate ({fmtPct(currentRate)}). You pay tax now at the higher rate and withdraw tax-free later.
            </>
          )}
          {result.winner === "traditional" && (
            <>
              <strong className="text-sky-700 dark:text-sky-400">Traditional wins</strong> by{" "}
              {fmt$(result.advantage)} because your retirement tax rate ({fmtPct(retirementRate)}) is lower than your
              current rate ({fmtPct(currentRate)}). You defer tax to when you&apos;re in a lower bracket.
            </>
          )}
          {result.winner === "tie" && (
            <>
              <strong className="text-foreground">It&apos;s a tie!</strong> When your current and retirement tax rates
              are equal, both strategies yield the same after-tax result. Consider diversifying with both.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
