import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Debt {
  name: string;
  balance: number;
  apr: number;
  minimum: number;
}

const DEBT_COLORS = [
  { fill: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500", bar: "bg-rose-500/20" },
  { fill: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", bar: "bg-amber-500/20" },
  { fill: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500", bar: "bg-sky-500/20" },
  { fill: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", bar: "bg-emerald-500/20" },
  { fill: "bg-violet-500", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500", bar: "bg-violet-500/20" },
];

const DEFAULT_DEBTS: Debt[] = [
  { name: "Credit Card", balance: 5000, apr: 24, minimum: 125 },
  { name: "Student Loan", balance: 12000, apr: 5.5, minimum: 150 },
  { name: "Car Loan", balance: 8000, apr: 9, minimum: 200 },
];

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface MonthSnapshot {
  month: number;
  balances: number[];
  paidOff: number[];
}

function simulateTimeline(debts: Debt[], extraPayment: number): {
  snapshots: MonthSnapshot[];
  totalMonths: number;
  payoffMonths: number[];
  totalInterest: number;
} {
  if (debts.length === 0) return { snapshots: [], totalMonths: 0, payoffMonths: [], totalInterest: 0 };

  const balances = debts.map((d) => d.balance);
  const rates = debts.map((d) => d.apr / 100 / 12);
  const minimums = debts.map((d) => d.minimum);
  const paidOff = new Set<number>();
  const payoffMonths: number[] = new Array(debts.length).fill(-1);
  const snapshots: MonthSnapshot[] = [];
  let month = 0;
  let totalInterest = 0;

  while (paidOff.size < debts.length && month < 600) {
    month++;
    let extra = extraPayment;

    for (let i = 0; i < debts.length; i++) {
      if (paidOff.has(i)) continue;
      // Apply minimum payment first
      balances[i] -= minimums[i];
      if (balances[i] < 0) {
        extra += Math.abs(balances[i]);
        balances[i] = 0;
        paidOff.add(i);
        payoffMonths[i] = month;
        continue;
      }
      // Then apply interest on remaining balance
      const interest = balances[i] * rates[i];
      totalInterest += interest;
      balances[i] += interest;
    }

    if (extra > 0) {
      const target = getAvalancheTarget(debts, balances, paidOff);
      if (target !== -1) {
        balances[target] -= extra;
        if (balances[target] <= 0) {
          const overflow = Math.abs(balances[target]);
          balances[target] = 0;
          if (!paidOff.has(target)) {
            paidOff.add(target);
            payoffMonths[target] = month;
          }
          if (overflow > 0) {
            const next = getAvalancheTarget(debts, balances, paidOff);
            if (next !== -1) {
              balances[next] -= overflow;
              if (balances[next] <= 0) {
                balances[next] = 0;
                if (!paidOff.has(next)) {
                  paidOff.add(next);
                  payoffMonths[next] = month;
                }
              }
            }
          }
        }
      }
    }

    snapshots.push({
      month,
      balances: [...balances],
      paidOff: [...paidOff],
    });
  }

  return { snapshots, totalMonths: month, payoffMonths, totalInterest };
}

function getAvalancheTarget(debts: Debt[], balances: number[], paidOff: Set<number>): number {
  let target = -1;
  for (let i = 0; i < debts.length; i++) {
    if (paidOff.has(i) || balances[i] <= 0) continue;
    if (target === -1 || debts[i].apr > debts[target].apr) {
      target = i;
    }
  }
  return target;
}

export default function PayoffTimeline() {
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [extraPayment, setExtraPayment] = useState(200);

  const { snapshots, totalMonths, payoffMonths, totalInterest } = useMemo(
    () => simulateTimeline(debts, extraPayment),
    [debts, extraPayment]
  );

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);

  function fmtMonths(m: number): string {
    const y = Math.floor(m / 12);
    const rem = m % 12;
    if (y === 0) return `${rem}mo`;
    if (rem === 0) return `${y}y`;
    return `${y}y ${rem}m`;
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

  function updateDebt(idx: number, field: keyof Debt, value: string | number) {
    setDebts((prev) =>
      prev.map((d, i) =>
        i === idx
          ? { ...d, [field]: typeof value === "string" && field !== "name" ? Number(value) || 0 : value }
          : d
      )
    );
  }

  const milestoneSnapshots = snapshots.filter(
    (s) => s.paidOff.length > (snapshots[snapshots.indexOf(s) - 1]?.paidOff.length ?? 0) || s.month === 1
  );

  const lastSnapshot = snapshots[snapshots.length - 1];

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-1">Payoff Timeline</h3>
        <p className="text-xs text-muted-foreground">
          Visual timeline of when each debt gets paid off using the avalanche strategy.
        </p>
      </div>

      <div className="space-y-3">
        {debts.map((debt, i) => {
          const color = DEBT_COLORS[i % DEBT_COLORS.length];
          return (
            <div key={i} className="rounded-lg bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn("shrink-0 size-2.5 rounded-sm", color.dot)} />
                <input
                  type="text"
                  value={debt.name}
                  onChange={(e) => updateDebt(i, "name", e.target.value)}
                  className="bg-transparent text-sm font-heading font-medium text-foreground focus:outline-none w-28"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Balance</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={debt.balance}
                      onChange={(e) => updateDebt(i, "balance", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">APR %</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={debt.apr}
                    onChange={(e) => updateDebt(i, "apr", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Min. Pmt</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={debt.minimum}
                      onChange={(e) => updateDebt(i, "minimum", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="pt-extra" className="text-sm text-muted-foreground shrink-0">
            Extra Monthly Payment
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="pt-extra"
              type="number"
              min={0}
              max={2000}
              step={25}
              value={extraPayment}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setExtraPayment(isNaN(v) ? 0 : Math.max(0, Math.min(v, 2000)));
              }}
              className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={2000}
          step={25}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full cursor-pointer accent-primary"
          aria-label="Extra monthly payment"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$2,000</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Debt" value={fmt$(totalBalance)} />
        <StatCard label="Total Interest" value={fmt$(totalInterest)} highlight />
        <StatCard label="Time to Debt-Free" value={totalMonths > 0 ? fmtMonths(totalMonths) : "—"} />
        <StatCard label="Total Paid" value={fmt$(totalBalance + totalInterest)} />
      </div>

      {totalMonths > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            Debt Balance Over Time (Avalanche Strategy)
          </p>

          <div className="space-y-2">
            {debts.map((debt, i) => {
              const color = DEBT_COLORS[i % DEBT_COLORS.length];
              const payoffMonth = payoffMonths[i];
              const isPaidOff = payoffMonth > 0;
              const barWidth = totalMonths > 0 ? (payoffMonth > 0 ? (payoffMonth / totalMonths) * 100 : 100) : 0;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("shrink-0 size-2 rounded-sm", color.dot)} />
                      <span className={cn("font-heading font-medium", color.text)}>
                        {debt.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      {isPaidOff ? `Paid off month ${payoffMonth}` : "Not paid off in timeline"}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", color.fill)}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-muted-foreground tabular-nums pt-1">
            <span>Month 0</span>
            <span>Month {totalMonths}</span>
          </div>
        </div>
      )}

      {milestoneSnapshots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Milestones</p>
          {payoffMonths
            .map((m, i) => ({ month: m, idx: i }))
            .filter((x) => x.month > 0)
            .sort((a, b) => a.month - b.month)
            .map((x, rank) => {
              const debt = debts[x.idx];
              const color = DEBT_COLORS[x.idx % DEBT_COLORS.length];
              return (
                <div
                  key={x.idx}
                  className="flex items-center gap-3 rounded-md bg-background p-2.5"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-6 rounded-full text-xs font-heading font-semibold text-primary-foreground",
                      color.fill
                    )}
                  >
                    {rank + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-heading text-sm font-medium", color.text)}>
                        {debt.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({fmt$(debt.balance)} at {debt.apr}%)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                    Month {x.month}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {lastSnapshot && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            With the <strong className="text-foreground">avalanche strategy</strong> and{" "}
            <strong className="text-foreground">${extraPayment}/month</strong> extra, you&apos;ll be
            completely debt-free in{" "}
            <strong className="text-primary">{totalMonths} months</strong> — paying{" "}
            <strong className="text-primary">{fmt$(totalInterest)}</strong>{" "}
            in total interest across all debts.
          </p>
        </div>
      )}
    </div>
  );
}
