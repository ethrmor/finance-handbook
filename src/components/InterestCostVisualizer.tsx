import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  CalculatorShell,
  CalculatorField,
  StatCard,
  StatsGrid,
  InfoBox,
} from "@/components/ui/calculator-shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

const DEFAULT_BALANCE = 5000;
const DEFAULT_APR = 24;
const DEFAULT_MIN_PCT = 2;

const comparisonConfig = {
  minimum: { label: "Minimum", color: "#f43f5e" },
  double: { label: "2× Minimum", color: "#10b981" },
} satisfies ChartConfig;

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

  const comparisonData = [
    { metric: "Interest", minimum: minResult.totalInterest, double: doubleResult.totalInterest },
    { metric: "Total Paid", minimum: minResult.totalPaid, double: doubleResult.totalPaid },
  ];

  return (
    <CalculatorShell
      title="Interest Cost Visualizer"
      description="See the true cost of making only minimum payments on a single debt."
    >
      <CalculatorField
        id="icv-balance"
        label="Balance"
        value={balance}
        onChange={setBalance}
        min={100}
        max={100000}
        step={500}
        prefix="$"
      />

      <CalculatorField
        id="icv-apr"
        label="APR"
        value={apr}
        onChange={setApr}
        min={0.5}
        max={40}
        step={0.5}
        suffix="%"
      />

      <CalculatorField
        id="icv-minpct"
        label="Minimum Payment %"
        value={minPct}
        onChange={setMinPct}
        min={1}
        max={5}
        step={0.5}
        suffix="%"
      />

      <StatsGrid cols={3}>
        <StatCard label="Time to Pay Off" value={fmtYears(minResult.months)} />
        <StatCard label="Total Interest" value={fmt$(minResult.totalInterest)} highlight />
        <StatCard label="Total Paid" value={fmt$(minResult.totalPaid)} />
      </StatsGrid>

      {balance > 0 && (
        <ChartContainer config={comparisonConfig} className="aspect-video max-h-[220px]">
          <BarChart data={comparisonData} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => fmt$(v)} />
            <YAxis type="category" dataKey="metric" width={80} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="minimum" fill="var(--color-minimum)" radius={4} />
            <Bar dataKey="double" fill="var(--color-double)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}

      {interestSaved > 0 && (
        <InfoBox type="default">
          Doubling your payment saves you{" "}
          <strong className="text-primary">{fmt$(interestSaved)} in interest</strong>
          {monthsFaster > 0 && (
            <>
              {" "}and gets you debt-free{" "}
              <strong className="text-primary">{fmtYears(monthsFaster)} faster</strong>
            </>
          )}. Minimum payments are designed to keep you paying for years — even a modest increase
          makes a dramatic difference.
        </InfoBox>
      )}
    </CalculatorShell>
  );
}
