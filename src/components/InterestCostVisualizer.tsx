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

function fmtYears(m: number): string {
  const y = Math.floor(m / 12);
  const rem = m % 12;
  if (y === 0) return `${rem} month${rem !== 1 ? "s" : ""}`;
  if (rem === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${rem}m`;
}

interface AmortResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
}

function amortize(balance: number, apr: number, monthlyPayment: number): AmortResult {
  if (monthlyPayment <= 0 || balance <= 0) {
    return { months: 0, totalInterest: 0, totalPaid: 0 };
  }
  const monthlyRate = apr / 100 / 12;
  let b = balance;
  let totalInterest = 0;
  let months = 0;

  while (b > 0 && months < 600) {
    months++;
    const interest = b * monthlyRate;
    totalInterest += interest;
    b += interest;
    const payment = Math.min(monthlyPayment, b);
    b -= payment;
    if (b < 0.01) b = 0;
  }

  return { months, totalInterest, totalPaid: balance + totalInterest };
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

const DEFAULT_BALANCE = 5000;
const DEFAULT_APR = 24;
const DEFAULT_MIN_PCT = 2;

export default function InterestCostVisualizer() {
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [apr, setApr] = useState(DEFAULT_APR);
  const [minPct, setMinPct] = useState(DEFAULT_MIN_PCT);

  const minPayment = Math.max(balance * (minPct / 100), 25);
  const doubleMinPayment = minPayment * 2;

  const minResult = useMemo(
    () => amortize(balance, apr, minPayment),
    [balance, apr, minPayment]
  );

  const doubleResult = useMemo(
    () => amortize(balance, apr, doubleMinPayment),
    [balance, apr, doubleMinPayment]
  );

  const interestSaved = minResult.totalInterest - doubleResult.totalInterest;
  const monthsFaster = minResult.months - doubleResult.months;

  const maxBarInterest = Math.max(minResult.totalInterest, 1);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-1">Interest Cost Visualizer</h3>
        <p className="text-xs text-muted-foreground">
          See the true cost of making only minimum payments on a single debt.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="icv-balance" className="text-sm text-muted-foreground shrink-0">
              Balance
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="icv-balance"
                type="number"
                min={100}
                max={100000}
                step={500}
                value={balance}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setBalance(isNaN(v) ? 0 : Math.max(0, Math.min(v, 100000)));
                }}
                className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={100000}
            step={500}
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Balance"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$100</span>
            <span>$100,000</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="icv-apr" className="text-sm text-muted-foreground shrink-0">
              APR
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="icv-apr"
                type="number"
                min={0.5}
                max={40}
                step={0.5}
                value={apr}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setApr(isNaN(v) ? 0 : Math.max(0, Math.min(v, 40)));
                }}
                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0.5}
            max={40}
            step={0.5}
            value={apr}
            onChange={(e) => setApr(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="APR"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5%</span>
            <span>40%</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="icv-minpct" className="text-sm text-muted-foreground shrink-0">
              Minimum Payment %
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="icv-minpct"
                type="number"
                min={1}
                max={5}
                step={0.5}
                value={minPct}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMinPct(isNaN(v) ? 1 : Math.max(1, Math.min(v, 5)));
                }}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={0.5}
            value={minPct}
            onChange={(e) => setMinPct(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Minimum payment percentage"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1%</span>
            <span>5%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Time to Pay Off" value={fmtYears(minResult.months)} />
        <StatCard label="Total Interest" value={fmt$(minResult.totalInterest)} highlight />
        <StatCard label="Total Paid" value={fmt$(minResult.totalPaid)} />
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">
          Minimum vs 2× Minimum Payment
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Minimum ({fmt$(minPayment)}/mo)
            </span>
            <span className="font-heading font-medium text-foreground tabular-nums">
              {fmt$(minResult.totalInterest)} interest
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (minResult.totalInterest / maxBarInterest) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {fmtYears(minResult.months)} to pay off &middot; {fmt$(minResult.totalPaid)} total
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              2× Minimum ({fmt$(doubleMinPayment)}/mo)
            </span>
            <span className="font-heading font-medium text-primary tabular-nums">
              {fmt$(doubleResult.totalInterest)} interest
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (doubleResult.totalInterest / maxBarInterest) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {fmtYears(doubleResult.months)} to pay off &middot; {fmt$(doubleResult.totalPaid)} total
          </div>
        </div>
      </div>

      {interestSaved > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Doubling your payment saves you{" "}
            <strong className="text-primary">{fmt$(interestSaved)} in interest</strong>
            {monthsFaster > 0 && (
              <>
                {" "}and gets you debt-free{" "}
                <strong className="text-primary">{fmtYears(monthsFaster)} faster</strong>
              </>
            )}. Minimum payments are designed to keep you paying for years — even a modest increase makes a dramatic difference.
          </p>
        </div>
      )}
    </div>
  );
}
