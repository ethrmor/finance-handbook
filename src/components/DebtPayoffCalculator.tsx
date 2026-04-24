import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  CalculatorContainer, 
  CalculatorHeader, 
  StatCard, 
  StatsGrid, 
  InfoBox 
} from "@/components/ui/calculator-layouts";

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minimum: number;
}

type Strategy = "avalanche" | "snowball";

const DEBT_COLORS = [
  { fill: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
  { fill: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  { fill: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  { fill: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  { fill: "bg-violet-500", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
];

const DEFAULT_DEBTS: Debt[] = [
  { id: "1", name: "Credit Card", balance: 5000, apr: 24, minimum: 125 },
  { id: "2", name: "Student Loan", balance: 12000, apr: 5.5, minimum: 150 },
  { id: "3", name: "Car Loan", balance: 8000, apr: 9, minimum: 200 },
];

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtMonths(m: number): string {
  const y = Math.floor(m / 12);
  const rem = m % 12;
  if (y === 0) return `${rem} month${rem !== 1 ? "s" : ""}`;
  if (rem === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${rem}m`;
}

interface PayoffResult {
  totalInterest: number;
  totalPaid: number;
  monthsToFreedom: number;
  debtPayoffOrder: { name: string; monthsIn: number; colorIdx: number }[];
}

function simulatePayoff(
  debts: Debt[],
  strategy: Strategy,
  extraPayment: number
): PayoffResult {
  if (debts.length === 0) {
    return { totalInterest: 0, totalPaid: 0, monthsToFreedom: 0, debtPayoffOrder: [] };
  }

  const balances = debts.map((d) => d.balance);
  const rates = debts.map((d) => d.apr / 100 / 12);
  const minimums = debts.map((d) => d.minimum);
  let totalInterest = 0;
  let months = 0;
  const payoffOrder: { name: string; monthsIn: number; colorIdx: number }[] = [];
  const paidOff = new Set<number>();

  while (paidOff.size < debts.length && months < 600) {
    months++;
    let extra = extraPayment;

    for (let i = 0; i < debts.length; i++) {
      if (paidOff.has(i)) continue;
      balances[i] -= minimums[i];
      if (balances[i] < 0) {
        extra += Math.abs(balances[i]);
        balances[i] = 0;
        paidOff.add(i);
        payoffOrder.push({ name: debts[i].name, monthsIn: months, colorIdx: i });
        continue;
      }
      const interest = balances[i] * rates[i];
      totalInterest += interest;
      balances[i] += interest;
    }

    if (extra > 0) {
      const target = getNextTarget(debts, balances, paidOff, strategy);
      if (target !== -1) {
        balances[target] -= extra;
        if (balances[target] <= 0) {
          const overflow = Math.abs(balances[target]);
          balances[target] = 0;
          if (!paidOff.has(target)) {
            paidOff.add(target);
            payoffOrder.push({ name: debts[target].name, monthsIn: months, colorIdx: target });
          }
          if (overflow > 0) {
            const nextTarget = getNextTarget(debts, balances, paidOff, strategy);
            if (nextTarget !== -1) {
              balances[nextTarget] -= overflow;
              if (balances[nextTarget] <= 0) {
                balances[nextTarget] = 0;
                if (!paidOff.has(nextTarget)) {
                  paidOff.add(nextTarget);
                  payoffOrder.push({ name: debts[nextTarget].name, monthsIn: months, colorIdx: nextTarget });
                }
              }
            }
          }
        }
      }
    }
  }

  const totalPaid = debts.reduce((s, d) => s + d.balance, 0) + totalInterest;
  return {
    totalInterest,
    totalPaid,
    monthsToFreedom: months,
    debtPayoffOrder: payoffOrder,
  };
}

function getNextTarget(
  debts: Debt[],
  balances: number[],
  paidOff: Set<number>,
  strategy: Strategy
): number {
  let target = -1;
  for (let i = 0; i < debts.length; i++) {
    if (paidOff.has(i) || balances[i] <= 0) continue;
    if (target === -1) {
      target = i;
    } else if (strategy === "avalanche" && debts[i].apr > debts[target].apr) {
      target = i;
    } else if (strategy === "snowball" && debts[i].balance < debts[target].balance) {
      target = i;
    }
  }
  return target;
}

function simulateMinimumOnly(debts: Debt[]): { totalInterest: number; monthsToFreedom: number } {
  if (debts.length === 0) return { totalInterest: 0, monthsToFreedom: 0 };

  const balances = debts.map((d) => d.balance);
  const rates = debts.map((d) => d.apr / 100 / 12);
  let totalInterest = 0;
  let months = 0;
  const paidOff = new Set<number>();

  while (paidOff.size < debts.length && months < 600) {
    months++;
    for (let i = 0; i < debts.length; i++) {
      if (paidOff.has(i)) continue;
      const minPay = Math.min(debts[i].minimum, balances[i]);
      balances[i] -= minPay;
      if (balances[i] <= 0) {
        balances[i] = 0;
        paidOff.add(i);
        continue;
      }
      const interest = balances[i] * rates[i];
      totalInterest += interest;
      balances[i] += interest;
    }
  }

  return { totalInterest, monthsToFreedom: months };
}

let nextId = 4;
function makeId() {
  return String(nextId++);
}

export default function DebtPayoffCalculator() {
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [extraPayment, setExtraPayment] = useState(200);

  const result = useMemo(
    () => simulatePayoff(debts, strategy, extraPayment),
    [debts, strategy, extraPayment]
  );

  const minOnlyResult = useMemo(() => simulateMinimumOnly(debts), [debts]);
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const interestSaved = minOnlyResult.totalInterest - result.totalInterest;
  const monthsFaster = minOnlyResult.monthsToFreedom - result.monthsToFreedom;

  function updateDebt(id: string, field: keyof Debt, value: string | number) {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: typeof value === "string" && field !== "name" ? Number(value) || 0 : value } : d))
    );
  }

  function addDebt() {
    if (debts.length >= 5) return;
    setDebts((prev) => [
      ...prev,
      { id: makeId(), name: `Debt ${prev.length + 1}`, balance: 3000, apr: 15, minimum: 75 },
    ]);
  }

  function removeDebt(id: string) {
    if (debts.length <= 1) return;
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <CalculatorContainer variant="card">
      <CalculatorHeader 
        variant="card"
        title="Debt Payoff Calculator" 
        description="Compare avalanche vs snowball strategies with your actual debts." 
      />

      <div className="flex gap-3">
        <button
          onClick={() => setStrategy("avalanche")}
          className={cn(
            "flex-1 rounded-lg px-4 py-3 text-sm font-heading font-semibold transition-all",
            strategy === "avalanche"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Avalanche
        </button>
        <button
          onClick={() => setStrategy("snowball")}
          className={cn(
            "flex-1 rounded-lg px-4 py-3 text-sm font-heading font-semibold transition-all",
            strategy === "snowball"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Snowball
        </button>
      </div>

      <div className="space-y-3">
        {debts.map((debt, i) => {
          const color = DEBT_COLORS[i % DEBT_COLORS.length];
          return (
            <div key={debt.id} className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("shrink-0 size-3 rounded-md", color.dot)} />
                  <input
                    type="text"
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, "name", e.target.value)}
                    className="bg-transparent text-sm font-heading font-semibold text-foreground focus:outline-none w-28"
                  />
                </div>
                {debts.length > 1 && (
                  <button
                    onClick={() => removeDebt(debt.id)}
                    className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Balance</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={debt.balance}
                      onChange={(e) => updateDebt(debt.id, "balance", e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">APR %</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={debt.apr}
                    onChange={(e) => updateDebt(debt.id, "apr", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Min. Pmt</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={debt.minimum}
                      onChange={(e) => updateDebt(debt.id, "minimum", e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {debts.length < 5 && (
          <button
            onClick={addDebt}
            className="w-full rounded-xl border border-dashed border-border/60 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/30 transition-all"
          >
            + Add debt
          </button>
        )}
      </div>

      <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="extra-payment" className="text-sm font-medium text-muted-foreground shrink-0">
            Extra Monthly Payment
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="extra-payment"
              type="number"
              min={0}
              max={2000}
              step={25}
              value={extraPayment}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setExtraPayment(isNaN(v) ? 0 : Math.max(0, Math.min(v, 2000)));
              }}
              className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
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
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>$0</span>
          <span>$2,000</span>
        </div>
      </div>

      <StatsGrid cols={4} variant="card">
        <StatCard variant="card" label="Total Debt" value={fmt$(totalBalance)} />
        <StatCard variant="card" label="Total Interest" value={fmt$(result.totalInterest)} highlight />
        <StatCard variant="card" label="Time to Debt-Free" value={fmtMonths(result.monthsToFreedom)} />
        <StatCard variant="card" label="Total Paid" value={fmt$(result.totalPaid)} />
      </StatsGrid>

      {interestSaved > 0 && (
        <InfoBox variant="card">
          With the{" "}
          <strong className="text-foreground">
            {strategy === "avalanche" ? "avalanche" : "snowball"}
          </strong>{" "}
          strategy and ${extraPayment}/month extra, you{" "}
          <strong className="text-primary">save {fmt$(interestSaved)} in interest</strong>{" "}
          {monthsFaster > 0 && (
            <>
              and <strong className="text-primary">pay off {fmtMonths(monthsFaster)} faster</strong>
            </>
          )}{" "}
          compared to making only minimum payments.
        </InfoBox>
      )}

      {result.debtPayoffOrder.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payoff Order</p>
          {result.debtPayoffOrder.map((d, i) => {
            const color = DEBT_COLORS[d.colorIdx % DEBT_COLORS.length];
            return (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-muted/30 border border-border/40 p-3">
                <span className="font-heading text-sm font-bold text-muted-foreground tabular-nums w-6 text-right">
                  {i + 1}.
                </span>
                <span className={cn("shrink-0 size-3 rounded-md", color.dot)} />
                <span className={cn("font-heading text-sm font-semibold", color.text)}>{d.name}</span>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                  Paid off at month {d.monthsIn}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CalculatorContainer>
  );
}
