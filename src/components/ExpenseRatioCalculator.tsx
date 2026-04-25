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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const DEFAULT_PORTFOLIO = 100_000;
const DEFAULT_FEE_A = 0.03;
const DEFAULT_FEE_B = 1.0;
const DEFAULT_YEARS = 30;
const DEFAULT_RETURN = 8;

const MAX_PORTFOLIO = 2_000_000;
const MAX_YEARS = 40;
const MAX_RETURN = 15;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface YearData {
  year: number;
  fundA: number;
  fundB: number;
}

function calculateExpenseRatio(
  portfolio: number,
  feeA: number,
  feeB: number,
  years: number,
  annualReturn: number
) {
  const r = annualReturn / 100;
  const fA = feeA / 100;
  const fB = feeB / 100;

  const yearData: YearData[] = [];
  let valA = portfolio;
  let valB = portfolio;

  for (let y = 1; y <= years; y++) {
    valA = valA * (1 + r - fA);
    valB = valB * (1 + r - fB);
    yearData.push({ year: y, fundA: valA, fundB: valB });
  }

  const diff = valA - valB;

  return {
    finalA: valA,
    finalB: valB,
    difference: diff,
    yearData,
  };
}

const chartConfig = {
  fundA: {
    label: "Fund A (lower fee)",
    color: "hsl(var(--primary))",
  },
  fundB: {
    label: "Fund B (higher fee)",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export default function ExpenseRatioCalculator() {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [feeA, setFeeA] = useState(DEFAULT_FEE_A);
  const [feeB, setFeeB] = useState(DEFAULT_FEE_B);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [annualReturn, setAnnualReturn] = useState(DEFAULT_RETURN);

  const result = useMemo(
    () => calculateExpenseRatio(portfolio, feeA, feeB, years, annualReturn),
    [portfolio, feeA, feeB, years, annualReturn]
  );

  const chartData = useMemo(() => {
    const data = result.yearData;
    if (data.length <= 20) return data;
    const step = Math.ceil(data.length / 20);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [result.yearData]);

  return (
    <CalculatorShell
      title="Expense Ratio Impact Calculator"
      description="A small difference in fees compounds into a massive gap over decades. See what that 1% really costs you."
    >
      <div className="flex flex-col gap-4">
        <CalculatorField
          id="er-portfolio"
          label="Portfolio Value"
          prefix="$"
          value={portfolio}
          onChange={setPortfolio}
          min={0}
          max={MAX_PORTFOLIO}
          step={5000}
        />
        <CalculatorField
          id="er-feeA"
          label="Fund A Expense Ratio"
          suffix="%"
          value={feeA}
          onChange={setFeeA}
          min={0}
          max={3}
          step={0.01}
        />
        <CalculatorField
          id="er-feeB"
          label="Fund B Expense Ratio"
          suffix="%"
          value={feeB}
          onChange={setFeeB}
          min={0}
          max={3}
          step={0.01}
        />
        <CalculatorField
          id="er-years"
          label="Time Horizon"
          suffix="yrs"
          value={years}
          onChange={setYears}
          min={1}
          max={MAX_YEARS}
          step={1}
        />
        <CalculatorField
          id="er-return"
          label="Expected Annual Return"
          suffix="%"
          value={annualReturn}
          onChange={setAnnualReturn}
          min={0}
          max={MAX_RETURN}
          step={0.5}
        />
      </div>

      <StatsGrid cols={3}>
        <StatCard label="Fund A Final Value" value={fmt$(result.finalA)} highlight />
        <StatCard label="Fund B Final Value" value={fmt$(result.finalB)} />
        <StatCard
          label="Fee Cost Difference"
          value={fmt$(result.difference)}
          highlight={result.difference > 0}
        />
      </StatsGrid>

      {result.difference > 0 && (
        <InfoBox type="error">
          Fund B&apos;s higher fee costs you{" "}
          <strong className="text-foreground">{fmt$(result.difference)}</strong> over{" "}
          {years} years. That&apos;s{" "}
          <strong className="text-foreground">
            {((result.difference / result.finalA) * 100).toFixed(1)}%
          </strong>{" "}
          of your potential portfolio — money that went to fees instead of your future.
        </InfoBox>
      )}

      {chartData.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            How the gap widens over time
          </p>
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
              <Line
                type="monotone"
                dataKey="fundA"
                stroke="var(--color-fundA)"
                strokeWidth={2}
                dot={false}
                name="fundA"
              />
              <Line
                type="monotone"
                dataKey="fundB"
                stroke="var(--color-fundB)"
                strokeWidth={2}
                dot={false}
                name="fundB"
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </CalculatorShell>
  );
}
