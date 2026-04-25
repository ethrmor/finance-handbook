import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  CalculatorField,
  StatCard,
  StatsGrid,
  InfoBox,
  CalculatorShell,
} from "@/components/ui/calculator-shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Debt {
  name: string;
  balance: number;
  apr: number;
  minimum: number;
}

const DEBT_COLORS = [
  { chart: "var(--color-debt-0)", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400" },
  { chart: "var(--color-debt-1)", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  { chart: "var(--color-debt-2)", dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-400" },
  { chart: "var(--color-debt-3)", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  { chart: "var(--color-debt-4)", dot: "bg-violet-500", text: "text-violet-700 dark:text-violet-400" },
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
      balances[i] -= minimums[i];
      if (balances[i] < 0) {
        extra += Math.abs(balances[i]);
        balances[i] = 0;
        paidOff.add(i);
        payoffMonths[i] = month;
        continue;
      }
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

  const payoffChartData = useMemo(
    () =>
      debts.map((debt, i) => ({
        name: debt.name,
        months: payoffMonths[i] > 0 ? payoffMonths[i] : 0,
      })),
    [debts, payoffMonths]
  );

  const payoffChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    debts.forEach((debt, i) => {
      config[`debt-${i}`] = { label: debt.name, color: DEBT_COLORS[i % DEBT_COLORS.length].chart };
    });
    return config satisfies ChartConfig;
  }, [debts]);

  return (
    <CalculatorShell
      title="Payoff Timeline"
      description="Visual timeline of when each debt gets paid off using the avalanche strategy."
    >
      <div className="flex flex-col gap-3">
        {debts.map((debt, i) => {
          const color = DEBT_COLORS[i % DEBT_COLORS.length];
          return (
            <div key={i} className="rounded-lg bg-card p-3 border border-border/40 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={`shrink-0 size-2.5 rounded-sm ${color.dot}`} />
                <Input
                  type="text"
                  value={debt.name}
                  onChange={(e) => updateDebt(i, "name", e.target.value)}
                  className="bg-transparent border-0 border-b border-input rounded-none px-0 py-0 text-sm font-heading font-medium text-foreground focus:outline-none focus:ring-0 focus:border-primary w-28 h-auto"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <CalculatorField
                  id={`pt-balance-${i}`}
                  label="Balance"
                  value={debt.balance}
                  onChange={(v) => updateDebt(i, "balance", v)}
                  min={0}
                  max={200_000}
                  step={100}
                  prefix="$"
                  slider={false}
                />
                <CalculatorField
                  id={`pt-apr-${i}`}
                  label="APR %"
                  value={debt.apr}
                  onChange={(v) => updateDebt(i, "apr", v)}
                  min={0}
                  max={50}
                  step={0.5}
                  suffix="%"
                  slider={false}
                />
                <CalculatorField
                  id={`pt-min-${i}`}
                  label="Min. Pmt"
                  value={debt.minimum}
                  onChange={(v) => updateDebt(i, "minimum", v)}
                  min={0}
                  max={10_000}
                  step={10}
                  prefix="$"
                  slider={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      <CalculatorField
        id="pt-extra"
        label="Extra Monthly Payment"
        value={extraPayment}
        onChange={setExtraPayment}
        min={0}
        max={2000}
        step={25}
        prefix="$"
      />

      <StatsGrid cols={4}>
        <StatCard label="Total Debt" value={fmt$(totalBalance)} />
        <StatCard label="Total Interest" value={fmt$(totalInterest)} highlight />
        <StatCard label="Time to Debt-Free" value={totalMonths > 0 ? fmtMonths(totalMonths) : "—"} />
        <StatCard label="Total Paid" value={fmt$(totalBalance + totalInterest)} />
      </StatsGrid>

      {totalMonths > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground font-medium">
            Debt Balance Over Time (Avalanche Strategy)
          </p>
          <ChartContainer
            config={payoffChartConfig}
            className="aspect-video w-full"
          >
            <BarChart data={payoffChartData} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {debts.map((_, i) => (
                <Bar
                  key={i}
                  dataKey="months"
                  fill={DEBT_COLORS[i % DEBT_COLORS.length].chart}
                  radius={[0, 4, 4, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {milestoneSnapshots.length > 0 && (
        <div className="flex flex-col gap-2">
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
                  className="flex items-center gap-3 rounded-md bg-card p-2.5 border border-border/40"
                >
                  <div
                    className={`flex items-center justify-center size-6 rounded-full text-xs font-heading font-semibold text-primary-foreground ${color.dot}`}
                  >
                    {rank + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-heading text-sm font-medium ${color.text}`}>
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
        <InfoBox type="default">
          With the <strong className="text-foreground">avalanche strategy</strong> and{" "}
          <strong className="text-foreground">${extraPayment}/month</strong> extra, you&apos;ll be
          completely debt-free in{" "}
          <strong className="text-primary">{totalMonths} months</strong> — paying{" "}
          <strong className="text-primary">{fmt$(totalInterest)}</strong>{" "}
          in total interest across all debts.
        </InfoBox>
      )}
    </CalculatorShell>
  );
}
