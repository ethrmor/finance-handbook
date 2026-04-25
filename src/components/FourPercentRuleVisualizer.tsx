import { useState, useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
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

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface WithdrawalResult {
  annualWithdrawal: number;
  monthlyWithdrawal: number;
  remainingAnnual: number;
  withdrawalPct: number;
}

function calculateWithdrawal(nestEgg: number): WithdrawalResult {
  const annualWithdrawal = nestEgg * 0.04;
  const monthlyWithdrawal = annualWithdrawal / 12;
  const remainingAnnual = nestEgg - annualWithdrawal;
  const withdrawalPct = 4;
  return { annualWithdrawal, monthlyWithdrawal, remainingAnnual, withdrawalPct };
}

const chartConfig = {
  withdrawal: { label: "Withdrawal", color: "#10b981" },
  remaining: { label: "Remaining", color: "#94a3b8" },
} satisfies ChartConfig;

export default function FourPercentRuleVisualizer() {
  const [nestEgg, setNestEgg] = useState(1_000_000);

  const result = useMemo(() => calculateWithdrawal(nestEgg), [nestEgg]);

  const chartData = [
    { name: "Withdrawal", value: result.annualWithdrawal, fill: "var(--color-withdrawal)" },
    { name: "Remaining", value: result.remainingAnnual, fill: "var(--color-remaining)" },
  ];

  return (
    <CalculatorShell
      title="4% Rule Visualizer"
      description="Enter your nest egg to see the safe annual and monthly withdrawal amounts based on the 4% rule."
    >
      <CalculatorField
        id="fourpct-nestegg"
        label="Nest Egg Amount"
        value={nestEgg}
        onChange={setNestEgg}
        min={0}
        max={10_000_000}
        step={10_000}
        prefix="$"
      />

      <StatsGrid cols={3}>
        <StatCard label="Safe Annual Withdrawal" value={fmt$(result.annualWithdrawal)} highlight />
        <StatCard label="Safe Monthly Withdrawal" value={fmt$(result.monthlyWithdrawal)} />
        <StatCard label="Remaining After Year 1" value={fmt$(result.remainingAnnual)} />
      </StatsGrid>

      {nestEgg > 0 && (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-w-[280px]">
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => fmt$(Number(value))} nameKey="name" />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      )}

      <InfoBox>
        The 4% rule suggests withdrawing{" "}
        <strong className="text-foreground">{fmt$(result.annualWithdrawal)}/year</strong> ({" "}
        {fmt$(result.monthlyWithdrawal)}/month) from a{" "}
        <strong className="text-foreground">{fmt$(nestEgg)}</strong> portfolio with a high probability of
        sustaining over 30 years. For longer retirements or conservative planning, consider 3–3.5% (
        {fmt$(nestEgg * 0.03)}/yr–{fmt$(nestEgg * 0.035)}/yr).
      </InfoBox>
    </CalculatorShell>
  );
}
