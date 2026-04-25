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

const DEFAULT_MONTHLY = 300;
const DEFAULT_YEARS = 20;
const DEFAULT_RATE = 10;
const DEFAULT_VOLATILITY = 1;

const MAX_MONTHLY = 5_000;
const MAX_YEARS = 40;
const MAX_RATE = 20;

const VOLATILITY_LABELS = ["Low", "Medium", "High"] as const;
const VOLATILITY_VALUES = [0.5, 1, 1.5] as const;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface MonthPoint {
  month: number;
  smoothValue: number;
  volatileValue: number;
  invested: number;
}

function calculateDCA(
  monthly: number,
  years: number,
  annualRate: number,
  volatilityIdx: number
) {
  const r = annualRate / 100;
  const monthlyRate = r / 12;
  const volMultiplier = VOLATILITY_VALUES[volatilityIdx];
  const totalMonths = years * 12;

  const rand = seededRandom(42);
  const points: MonthPoint[] = [];

  let smoothBalance = 0;
  let volatileBalance = 0;
  let totalInvested = 0;

  for (let m = 1; m <= totalMonths; m++) {
    totalInvested += monthly;
    smoothBalance = smoothBalance * (1 + monthlyRate) + monthly;

    const noise = (rand() - 0.5) * 2 * volMultiplier * monthlyRate * 3;
    volatileBalance = volatileBalance * (1 + monthlyRate + noise) + monthly;
    volatileBalance = Math.max(volatileBalance, totalInvested * 0.3);

    if (m % Math.max(1, Math.floor(totalMonths / 24)) === 0 || m === totalMonths) {
      points.push({
        month: m,
        smoothValue: smoothBalance,
        volatileValue: volatileBalance,
        invested: totalInvested,
      });
    }
  }

  const finalSmooth = smoothBalance;
  const finalVolatile = volatileBalance;

  return {
    totalInvested,
    smoothFinal: finalSmooth,
    volatileFinal: finalVolatile,
    points,
  };
}

const chartConfig = {
  smoothValue: {
    label: "Smooth growth",
    color: "hsl(var(--primary))",
  },
  volatileValue: {
    label: "With volatility",
    color: "hsl(var(--chart-4))",
  },
  invested: {
    label: "Amount invested",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

export default function DCASimulator() {
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [volatility, setVolatility] = useState(DEFAULT_VOLATILITY);

  const result = useMemo(
    () => calculateDCA(monthly, years, rate, volatility),
    [monthly, years, rate, volatility]
  );

  const chartData = useMemo(
    () =>
      result.points.map((p) => ({
        ...p,
        yearLabel: `Yr ${(p.month / 12).toFixed(1)}`,
      })),
    [result.points]
  );

  return (
    <CalculatorShell
      title="Dollar-Cost Averaging Simulator"
      description="Investing a fixed amount every month smooths out market ups and downs. See how steady contributions ride through volatility."
    >
      <div className="flex flex-col gap-4">
        <CalculatorField
          id="dca-monthly"
          label="Monthly Investment"
          prefix="$"
          value={monthly}
          onChange={setMonthly}
          min={0}
          max={MAX_MONTHLY}
          step={50}
        />
        <CalculatorField
          id="dca-years"
          label="Investment Period"
          suffix="yrs"
          value={years}
          onChange={setYears}
          min={1}
          max={MAX_YEARS}
          step={1}
        />
        <CalculatorField
          id="dca-rate"
          label="Assumed Annual Return"
          suffix="%"
          value={rate}
          onChange={setRate}
          min={0}
          max={MAX_RATE}
          step={0.5}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Volatility</span>
          <CalculatorToggle
            options={VOLATILITY_LABELS.map((label, i) => ({
              value: String(i),
              label,
            }))}
            value={String(volatility)}
            onChange={(v: string) => setVolatility(Number(v))}
          />
        </div>
      </div>

      <StatsGrid cols={3}>
        <StatCard label="Total Invested" value={fmt$(result.totalInvested)} />
        <StatCard label="Smooth Growth" value={fmt$(result.smoothFinal)} highlight />
        <StatCard label="With Volatility" value={fmt$(result.volatileFinal)} />
      </StatsGrid>

      {chartData.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Growth trajectory: smooth path vs. actual returns with volatility
          </p>
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="yearLabel"
                tickLine={false}
                axisLine={false}
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
                dataKey="smoothValue"
                stroke="var(--color-smoothValue)"
                strokeWidth={2}
                dot={false}
                name="smoothValue"
              />
              <Line
                type="monotone"
                dataKey="volatileValue"
                stroke="var(--color-volatileValue)"
                strokeWidth={2}
                dot={false}
                name="volatileValue"
              />
              <Line
                type="monotone"
                dataKey="invested"
                stroke="var(--color-invested)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                name="invested"
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}

      <InfoBox type="default">
        With dollar-cost averaging, you invest the same amount every month regardless of price.
        When the market dips, your money buys more shares; when it rises, you buy fewer.
        Over time, this smooths out the average price you pay — and removes the stress of
        trying to time the market.
      </InfoBox>
    </CalculatorShell>
  );
}
