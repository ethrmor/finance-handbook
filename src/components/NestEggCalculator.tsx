"use client";

import { useState, useMemo } from "react";
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
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface NestEggResult {
  projectedTotal: number;
  totalContributions: number;
  interestEarned: number;
  monthlyIncome: number;
  contributionPct: number;
  interestPct: number;
}

interface YearPoint {
  year: number;
  contributions: number;
  interest: number;
  total: number;
}

function calculateNestEgg(
  currentSavings: number,
  monthlyContribution: number,
  years: number,
  returnRate: number
): NestEggResult & { yearPoints: YearPoint[] } {
  const r = returnRate;
  const n = years;

  const fvCurrent = currentSavings * Math.pow(1 + r, n);

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

  const yearPoints: YearPoint[] = [];
  let runningTotal = currentSavings;
  let runningContributions = currentSavings;

  for (let y = 1; y <= n; y++) {
    runningTotal = runningTotal * (1 + r) + monthlyContribution * 12;
    runningContributions += monthlyContribution * 12;
    const interest = runningTotal - runningContributions;
    yearPoints.push({
      year: y,
      contributions: runningContributions,
      interest: Math.max(interest, 0),
      total: runningTotal,
    });
  }

  return {
    projectedTotal,
    totalContributions,
    interestEarned,
    monthlyIncome,
    contributionPct,
    interestPct,
    yearPoints,
  };
}

const chartConfig = {
  contributions: {
    label: "Contributions",
    color: "hsl(var(--chart-1))",
  },
  interest: {
    label: "Interest earned",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export default function NestEggCalculator() {
  const [currentSavings, setCurrentSavings] = useState(25_000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(30);
  const [returnRate, setReturnRate] = useState(0.07);

  const result = useMemo(
    () => calculateNestEgg(currentSavings, monthlyContribution, years, returnRate),
    [currentSavings, monthlyContribution, years, returnRate]
  );

  const chartData = useMemo(() => {
    const data = result.yearPoints;
    if (data.length <= 20) return data;
    const step = Math.ceil(data.length / 20);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [result.yearPoints]);

  return (
    <CalculatorShell
      title="Nest Egg Calculator"
      description="Project your retirement savings based on current balance, monthly contributions, and expected returns."
    >
      <div className="flex flex-col gap-4">
        <CalculatorField
          id="nest-current"
          label="Current Savings"
          prefix="$"
          value={currentSavings}
          onChange={setCurrentSavings}
          min={0}
          max={1_000_000}
          step={5000}
        />
        <CalculatorField
          id="nest-monthly"
          label="Monthly Contribution"
          prefix="$"
          value={monthlyContribution}
          onChange={setMonthlyContribution}
          min={0}
          max={5000}
          step={50}
        />
        <CalculatorField
          id="nest-years"
          label="Years to Retirement"
          value={years}
          onChange={setYears}
          min={1}
          max={45}
          step={1}
        />
        <CalculatorField
          id="nest-return"
          label="Expected Annual Return"
          suffix="%"
          value={returnRate * 100}
          onChange={(v: number) => setReturnRate(v / 100)}
          min={0}
          max={15}
          step={0.5}
        />
      </div>

      <StatsGrid cols={4}>
        <StatCard label="Projected Total" value={fmt$(result.projectedTotal)} highlight />
        <StatCard label="Total Contributions" value={fmt$(result.totalContributions)} />
        <StatCard label="Interest Earned" value={fmt$(result.interestEarned)} />
        <StatCard label="Est. Monthly Income" value={fmt$(result.monthlyIncome)} />
      </StatsGrid>

      {chartData.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Nest egg accumulation over time
          </p>
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `Yr ${v}`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => fmt$(v)}
                width={80}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => fmt$(Number(value ?? 0))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="contributions"
                stroke="var(--color-contributions)"
                fill="var(--color-contributions)"
                fillOpacity={0.4}
                stackId="1"
                name="contributions"
              />
              <Area
                type="monotone"
                dataKey="interest"
                stroke="var(--color-interest)"
                fill="var(--color-interest)"
                fillOpacity={0.4}
                stackId="1"
                name="interest"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      <InfoBox type="default">
        Your estimated monthly retirement income of{" "}
        <strong className="text-foreground">{fmt$(result.monthlyIncome)}</strong> is based on the 4% safe withdrawal
        rule. This assumes a 30-year retirement with a balanced portfolio. For longer retirements or more
        conservative planning, use a 3–3.5% rate instead.
      </InfoBox>
    </CalculatorShell>
  );
}
