import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

interface ComparisonResult {
  traditionalBalance: number;
  traditionalAfterTax: number;
  rothBalance: number;
  rothAfterTax: number;
  taxPaidNowRoth: number;
  taxPaidLaterTraditional: number;
  winner: "traditional" | "roth" | "tie";
  advantage: number;
}

function calculateComparison(
  contribution: number,
  currentRate: number,
  retirementRate: number,
  years: number,
  returnRate: number
): ComparisonResult {
  const r = returnRate;
  const n = years;

  // Future value of annuity factor: ((1+r)^n - 1) / r
  const fvaFactor = r > 0 ? (Math.pow(1 + r, n) - 1) / r : n;

  // Traditional: full pre-tax contribution goes in, grows, then taxed on withdrawal
  const traditionalBalance = contribution * fvaFactor * (1 + r);
  const taxPaidLaterTraditional = traditionalBalance * retirementRate;
  const traditionalAfterTax = traditionalBalance * (1 - retirementRate);

  // Roth: after-tax contribution goes in, grows tax-free
  const afterTaxContribution = contribution * (1 - currentRate);
  const rothBalance = afterTaxContribution * fvaFactor * (1 + r);
  const taxPaidNowRoth = contribution * currentRate;
  const rothAfterTax = rothBalance;

  const diff = rothAfterTax - traditionalAfterTax;
  const winner = Math.abs(diff) < 1 ? "tie" : diff > 0 ? "roth" : "traditional";

  return {
    traditionalBalance,
    traditionalAfterTax,
    rothBalance,
    rothAfterTax,
    taxPaidNowRoth,
    taxPaidLaterTraditional,
    winner,
    advantage: Math.abs(diff),
  };
}

const chartConfig = {
  traditional: { label: "Traditional", color: "#0ea5e9" },
  roth: { label: "Roth", color: "#10b981" },
} satisfies ChartConfig;

export default function RothVsTraditionalCalculator() {
  const [contribution, setContribution] = useState(7000);
  const [currentRate, setCurrentRate] = useState(0.24);
  const [retirementRate, setRetirementRate] = useState(0.15);
  const [years, setYears] = useState(30);
  const [returnRate, setReturnRate] = useState(0.07);

  const result = useMemo(
    () => calculateComparison(contribution, currentRate, retirementRate, years, returnRate),
    [contribution, currentRate, retirementRate, years, returnRate]
  );

  const chartData = [
    {
      category: "Gross Balance",
      traditional: result.traditionalBalance,
      roth: result.rothBalance,
    },
    {
      category: "After-Tax",
      traditional: result.traditionalAfterTax,
      roth: result.rothAfterTax,
    },
    {
      category: "Tax Paid",
      traditional: result.taxPaidLaterTraditional,
      roth: result.taxPaidNowRoth,
    },
  ];

  const infoType =
    result.winner === "roth"
      ? "success"
      : "default";

  return (
    <CalculatorShell
      title="Roth vs Traditional Calculator"
      description="Compare after-tax outcomes of pre-tax (Traditional) vs after-tax (Roth) contributions."
    >
      <div className="flex flex-col gap-4">
        <CalculatorField
          id="roth-contribution"
          label="Annual Contribution"
          value={contribution}
          onChange={setContribution}
          min={0}
          max={23500}
          step={500}
          prefix="$"
        />
        <CalculatorField
          id="roth-current-rate"
          label="Current Tax Rate"
          value={currentRate}
          onChange={setCurrentRate}
          min={0}
          max={0.5}
          step={0.01}
          suffix="%"
        />
        <CalculatorField
          id="roth-retirement-rate"
          label="Retirement Tax Rate"
          value={retirementRate}
          onChange={setRetirementRate}
          min={0}
          max={0.5}
          step={0.01}
          suffix="%"
        />
        <CalculatorField
          id="roth-years"
          label="Years Until Retirement"
          value={years}
          onChange={setYears}
          min={1}
          max={45}
          step={1}
        />
        <CalculatorField
          id="roth-return"
          label="Expected Annual Return"
          value={returnRate}
          onChange={setReturnRate}
          min={0}
          max={0.15}
          step={0.005}
          suffix="%"
        />
      </div>

      <StatsGrid cols={4}>
        <StatCard label="Traditional After-Tax" value={fmt$(result.traditionalAfterTax)} />
        <StatCard label="Roth After-Tax" value={fmt$(result.rothAfterTax)} highlight />
        <StatCard label="Tax Paid Now (Roth)" value={fmt$(result.taxPaidNowRoth)} />
        <StatCard label="Tax Paid Later (Trad)" value={fmt$(result.taxPaidLaterTraditional)} />
      </StatsGrid>

      <ChartContainer config={chartConfig} className="aspect-[2/1]">
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v: number) => fmt$(v)} />
          <ChartTooltip
            content={<ChartTooltipContent formatter={(value) => fmt$(Number(value))} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="traditional" fill="var(--color-traditional)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="roth" fill="var(--color-roth)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>

      <InfoBox type={infoType}>
        {result.winner === "roth" && (
          <>
            <strong className="text-emerald-700 dark:text-emerald-400">Roth wins</strong> by{" "}
            {fmt$(result.advantage)} because your retirement tax rate ({fmtPct(retirementRate)}) is lower than your
            current rate ({fmtPct(currentRate)}). You pay tax now at the higher rate and withdraw tax-free later.
          </>
        )}
        {result.winner === "traditional" && (
          <>
            <strong className="text-sky-700 dark:text-sky-400">Traditional wins</strong> by{" "}
            {fmt$(result.advantage)} because your retirement tax rate ({fmtPct(retirementRate)}) is lower than your
            current rate ({fmtPct(currentRate)}). You defer tax to when you&apos;re in a lower bracket.
          </>
        )}
        {result.winner === "tie" && (
          <>
            <strong className="text-foreground">It&apos;s a tie!</strong> When your current and retirement tax rates
            are equal, both strategies yield the same after-tax result. Consider diversifying with both.
          </>
        )}
      </InfoBox>
    </CalculatorShell>
  );
}
