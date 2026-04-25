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

function formatCurrencyAxis(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

const equityChartConfig = {
  loanBalance: { label: "Loan Balance", color: "hsl(200 80% 55%)" },
  equity: { label: "Equity", color: "hsl(150 60% 45%)" },
} satisfies ChartConfig;

export default function HomeEquityVisualizer() {
  const [purchasePrice, setPurchasePrice] = useState(400_000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [annualAppreciation, setAnnualAppreciation] = useState(3);

  const result = useMemo(() => {
    const dp = purchasePrice * (downPaymentPct / 100);
    const loanAmount = purchasePrice - dp;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTerm * 12;

    let monthlyPI = 0;
    if (monthlyRate > 0 && totalMonths > 0 && loanAmount > 0) {
      monthlyPI =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const yearlyData: { year: number; homeValue: number; loanBalance: number; equity: number }[] = [];

    for (let year = 0; year <= loanTerm; year++) {
      const monthsPaid = year * 12;

      let remainingBalance = 0;
      if (monthlyRate > 0 && loanAmount > 0) {
        remainingBalance =
          (loanAmount *
            (Math.pow(1 + monthlyRate, totalMonths) -
              Math.pow(1 + monthlyRate, monthsPaid))) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);
      } else if (loanAmount > 0) {
        remainingBalance = Math.max(0, loanAmount - monthlyPI * monthsPaid);
      }

      const homeValue =
        purchasePrice * Math.pow(1 + annualAppreciation / 100, year);
      const equity = homeValue - remainingBalance;

      yearlyData.push({
        year,
        homeValue: Math.round(homeValue),
        loanBalance: Math.round(remainingBalance),
        equity: Math.round(equity),
      });
    }

    const finalEquity =
      yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].equity : 0;
    const totalInterest =
      monthlyPI * totalMonths - loanAmount;

    return {
      yearlyData,
      monthlyPI,
      totalInterest,
      finalEquity,
      loanAmount,
    };
  }, [purchasePrice, downPaymentPct, interestRate, loanTerm, annualAppreciation]);

  return (
    <CalculatorShell
      title="Home Equity Visualizer"
      description="See how your equity grows over time as you pay down your mortgage."
    >
      <div className="space-y-3">
        <CalculatorField
          id="he-price"
          label="Purchase Price"
          value={purchasePrice}
          onChange={setPurchasePrice}
          min={0}
          max={2_000_000}
          step={10_000}
          prefix="$"
        />
        <CalculatorField
          id="he-down"
          label="Down Payment"
          value={downPaymentPct}
          onChange={setDownPaymentPct}
          min={0}
          max={100}
          step={1}
          suffix="%"
        />
        <CalculatorField
          id="he-rate"
          label="Interest Rate"
          value={interestRate}
          onChange={setInterestRate}
          min={0}
          max={15}
          step={0.1}
          suffix="%"
        />
        <CalculatorField
          id="he-term"
          label="Loan Term"
          value={loanTerm}
          onChange={setLoanTerm}
          min={5}
          max={30}
          step={5}
          suffix="yrs"
          slider={false}
        />
        <CalculatorField
          id="he-appreciation"
          label="Annual Appreciation"
          value={annualAppreciation}
          onChange={setAnnualAppreciation}
          min={-5}
          max={15}
          step={0.5}
          suffix="%"
        />
      </div>

      <StatsGrid cols={4}>
        <StatCard label="Monthly P&I" value={fmt$(result.monthlyPI)} />
        <StatCard label="Total Interest" value={fmt$(result.totalInterest)} />
        <StatCard label="Equity at Term End" value={fmt$(result.finalEquity)} highlight />
        <StatCard label="Loan Amount" value={fmt$(result.loanAmount)} />
      </StatsGrid>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">
          Equity vs. Loan Balance Over Time
        </p>
        <ChartContainer config={equityChartConfig} className="h-[280px] w-full">
          <AreaChart data={result.yearlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
              width={60}
              tickFormatter={formatCurrencyAxis}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="loanBalance"
              stackId="1"
              fill="var(--color-loanBalance)"
              stroke="var(--color-loanBalance)"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stackId="1"
              fill="var(--color-equity)"
              stroke="var(--color-equity)"
              fillOpacity={0.6}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>

      <InfoBox>
        Early mortgage payments are mostly interest — in the first years, equity builds slowly.
        As you pay down principal and the home appreciates, equity accelerates. By year 15 of a
        30-year mortgage, you&apos;ve typically built{" "}
        <strong className="text-foreground">30–50% equity</strong> through a combination of
        principal paydown and appreciation. This is why time horizon matters: selling early means
        less equity captured.
      </InfoBox>
    </CalculatorShell>
  );
}
