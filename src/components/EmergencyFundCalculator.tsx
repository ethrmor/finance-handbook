"use client";

import { useState, useMemo } from "react";
import {
  CalculatorField,
  CalculatorToggle,
  StatCard,
  StatsGrid,
  InfoBox,
  CalculatorShell,
} from "@/components/ui/calculator-shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Stability = "stable" | "average" | "unstable";

const STABILITY_OPTIONS: { value: Stability; label: string; months: number; description: string }[] = [
  { value: "stable", label: "Stable", months: 3, description: "Government job, tenured position, steady contract" },
  { value: "average", label: "Average", months: 6, description: "Standard W-2 employment, moderate industry risk" },
  { value: "unstable", label: "Unstable", months: 9, description: "Freelance, commission-based, startup environment" },
];

const EARNER_MULTIPLIER: Record<number, number> = {
  1: 1,
  2: 0.75,
  3: 0.6,
  4: 0.5,
};

const MAX_EXPENSES = 20_000;
const DEFAULT_EXPENSES = 3_500;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const chartConfig = {
  target: {
    label: "Target fund",
    color: "hsl(var(--primary))",
  },
  perMonth: {
    label: "Per month",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function EmergencyFundCalculator() {
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [stability, setStability] = useState<Stability>("average");
  const [earners, setEarners] = useState(1);

  const result = useMemo(() => {
    const baseMonths = STABILITY_OPTIONS.find((o) => o.value === stability)?.months ?? 6;
    const multiplier = EARNER_MULTIPLIER[earners] ?? 1;
    const recommendedMonths = Math.round(baseMonths * multiplier);
    const target = expenses * recommendedMonths;
    return { recommendedMonths, target, baseMonths };
  }, [expenses, stability, earners]);

  const stabilityInfo = STABILITY_OPTIONS.find((o) => o.value === stability)!;

  const barData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        target: i + 1 <= result.recommendedMonths ? expenses : 0,
        perMonth: expenses,
      })),
    [expenses, result.recommendedMonths]
  );

  return (
    <CalculatorShell
      title="Emergency Fund Calculator"
      description="Figure out how many months of expenses you should keep in your emergency fund based on your job stability and household income."
    >
      <div className="flex flex-col gap-4">
        <CalculatorField
          id="ef-expenses"
          label="Monthly Expenses"
          prefix="$"
          value={expenses}
          onChange={setExpenses}
          min={0}
          max={MAX_EXPENSES}
          step={100}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Job Stability</span>
          <CalculatorToggle
            options={STABILITY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={stability}
            onChange={(v: Stability) => setStability(v)}
          />
          <p className="text-xs text-muted-foreground">{stabilityInfo.description}</p>
        </div>

        <CalculatorField
          id="ef-earners"
          label="Income Earners"
          value={earners}
          onChange={setEarners}
          min={1}
          max={4}
          step={1}
          slider={false}
        />
        <p className="text-xs text-muted-foreground -mt-2">
          More earners = less risk per person. Multi-household incomes need smaller buffers per earner.
        </p>
      </div>

      <StatsGrid cols={3}>
        <StatCard label="Recommended Months" value={`${result.recommendedMonths} mo`} highlight />
        <StatCard label="Monthly Expenses" value={fmt$(expenses)} />
        <StatCard label="Target Fund" value={fmt$(result.target)} highlight />
      </StatsGrid>

      {expenses > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Fund progress by month
          </p>
          <ChartContainer config={chartConfig} className="h-40 w-full">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}mo`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => fmt$(v)}
                width={70}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => fmt$(Number(value ?? 0))}
                  />
                }
              />
              <Bar
                dataKey="target"
                fill="var(--color-target)"
                radius={[4, 4, 0, 0]}
                name="target"
              />
              <Bar
                dataKey="perMonth"
                fill="var(--color-perMonth)"
                radius={[4, 4, 0, 0]}
                name="perMonth"
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">How the recommendation works</p>
        <div className="rounded-md p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base ({stabilityInfo.label} job)</span>
            <span className="font-heading font-medium tabular-nums">{result.baseMonths} months</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Earner adjustment ({earners} earner{earners > 1 ? "s" : ""})</span>
            <span className="font-heading font-medium tabular-nums">&times;{EARNER_MULTIPLIER[earners]}</span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Recommended</span>
            <span className="font-heading font-semibold tabular-nums text-primary">
              {result.recommendedMonths} months = {fmt$(result.target)}
            </span>
          </div>
        </div>
      </div>

      {expenses > 0 && (
        <InfoBox type="default">
          Start with <strong className="text-foreground">one month of expenses</strong> as your initial
          target, then build toward the full recommendation. Even a partial fund prevents a single bad
          week from derailing your whole plan.
        </InfoBox>
      )}
    </CalculatorShell>
  );
}
