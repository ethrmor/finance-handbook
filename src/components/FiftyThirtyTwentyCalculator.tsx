import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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

const CATEGORIES = [
  {
    key: "needs" as const,
    label: "Needs",
    pct: 0.5,
    color: "#10b981",
    description: "Rent, groceries, utilities, insurance, minimum debt payments",
  },
  {
    key: "wants" as const,
    label: "Wants",
    pct: 0.3,
    color: "#0ea5e9",
    description: "Dining out, entertainment, hobbies, travel",
  },
  {
    key: "savings" as const,
    label: "Savings & Debt Payoff",
    pct: 0.2,
    color: "#f59e0b",
    description: "Emergency fund, extra debt payments, retirement contributions",
  },
];

const MAX_INCOME = 25_000;
const DEFAULT_INCOME = 8_000;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const chartConfig = {
  needs: { label: "Needs", color: "#10b981" },
  wants: { label: "Wants", color: "#0ea5e9" },
  savings: { label: "Savings & Debt Payoff", color: "#f59e0b" },
} satisfies ChartConfig;

export default function FiftyThirtyTwentyCalculator() {
  const [income, setIncome] = useState(DEFAULT_INCOME);

  const allocations = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        amount: income * cat.pct,
      })),
    [income]
  );

  const pieData = allocations.map((cat) => ({
    name: cat.label,
    value: cat.amount,
    key: cat.key,
  }));

  const barData = allocations.map((cat) => ({
    name: cat.label,
    amount: cat.amount,
    key: cat.key,
  }));

  return (
    <CalculatorShell
      title="50/30/20 Rule Calculator"
      description="A simple framework for budgeting: 50% needs, 30% wants, 20% savings."
    >
      <CalculatorField
        id="ftt-income"
        label="Monthly Net Income"
        value={income}
        onChange={setIncome}
        min={0}
        max={MAX_INCOME}
        step={50}
        prefix="$"
      />

      <StatsGrid cols={3}>
        {allocations.map((cat) => (
          <StatCard
            key={cat.key}
            label={`${cat.label} (${(cat.pct * 100).toFixed(0)}%)`}
            value={fmt$(cat.amount)}
            highlight={cat.key === "savings"}
          />
        ))}
      </StatsGrid>

      {income > 0 && (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="key"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
            >
              {pieData.map((entry) => (
                <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="key" />} />
          </PieChart>
        </ChartContainer>
      )}

      {income > 0 && (
        <ChartContainer config={chartConfig} className="aspect-video max-h-[200px]">
          <BarChart data={barData} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => fmt$(v)} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
            <Bar dataKey="amount" radius={4}>
              {barData.map((entry) => (
                <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}

      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category Breakdown</p>
        {allocations.map((cat) => (
          <div key={cat.key} className="rounded-xl bg-background/60 border border-border/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="shrink-0 size-4 rounded-md shadow-sm"
                  style={{ backgroundColor: cat.color }}
                />
                <span
                  className="font-heading text-base font-bold shrink-0"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </span>
              </div>
              <span
                className="font-heading text-lg font-bold tabular-nums shrink-0"
                style={{ color: cat.color }}
              >
                {fmt$(cat.amount)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">{cat.description}</p>
          </div>
        ))}
      </div>

      {income > 0 && (
        <InfoBox type="default">
          These percentages are{" "}
          <strong className="text-foreground">guidelines, not commandments</strong>. If your needs
          exceed 50%, adjust wants and savings accordingly. The goal is intentional
          allocation—not hitting an exact number.
        </InfoBox>
      )}
    </CalculatorShell>
  );
}
