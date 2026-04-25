import { useState, useMemo } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
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
  type ChartConfig,
} from "@/components/ui/chart";

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

const BRACKET_HEX_COLORS = [
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#f43f5e",
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

const chartConfig = {
  tax: { label: "Tax", color: "#0ea5e9" },
} satisfies ChartConfig;

export default function TaxBracketVisualizer() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const result = useMemo(() => calculateTax(income), [income]);

  const chartData = result.brackets
    .map((b, i) => ({ ...b, idx: i }))
    .filter((b) => b.active)
    .map((b) => ({
      name: b.label,
      range: fmtRange(b.displayMin, b.displayMax),
      tax: b.taxInBracket,
      fill: BRACKET_HEX_COLORS[b.idx],
    }));

  return (
    <CalculatorShell
      title="Tax Bracket Visualizer"
      description="See how your income is taxed across federal brackets."
    >
      <CalculatorField
        id="tax-income"
        label="Annual Income"
        value={income}
        onChange={setIncome}
        min={0}
        max={MAX_INCOME}
        step={500}
        prefix="$"
      />

      <StatsGrid cols={4}>
        <StatCard label="Total Tax" value={fmt$(result.totalTax)} />
        <StatCard label="Effective Rate" value={fmtPct(result.effectiveRate)} highlight />
        <StatCard
          label="Marginal Rate"
          value={result.marginalRate > 0 ? `${(result.marginalRate * 100).toFixed(0)}%` : "—"}
        />
        <StatCard label="Take-Home" value={fmt$(result.takeHome)} />
      </StatsGrid>

      {income > 0 && chartData.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Tax by bracket</p>
          <ChartContainer config={chartConfig} className="aspect-[3/2]">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickFormatter={(v: number) => fmt$(v)} />
              <YAxis dataKey="name" type="category" width={45} tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => fmt$(Number(value))} />}
              />
              <Bar dataKey="tax" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {income > 0 && result.marginalRate > result.effectiveRate && (
        <InfoBox>
          Your <strong className="text-foreground">effective rate</strong> (
          {fmtPct(result.effectiveRate)}) is always lower than your{" "}
          <strong className="text-foreground">marginal rate</strong> (
          {(result.marginalRate * 100).toFixed(0)}%) because only the dollars in each bucket are
          taxed at that rate. Moving into a higher bracket doesn&apos;t change the rate on income
          in lower brackets.
        </InfoBox>
      )}
    </CalculatorShell>
  );
}
