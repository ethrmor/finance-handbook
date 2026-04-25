import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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

const DEFAULT_PRINCIPAL = 5_000;
const DEFAULT_MONTHLY = 300;
const DEFAULT_RATE = 10;
const DEFAULT_YEARS = 30;
const MAX_PRINCIPAL = 500_000;
const MAX_MONTHLY = 5_000;
const MAX_RATE = 20;
const MAX_YEARS = 50;

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
  balance: number;
  contributions: number;
  interest: number;
}

function calculateCompound(
  principal: number,
  monthly: number,
  annualRate: number,
  years: number
) {
  const r = annualRate / 100;
  const monthlyRate = r / 12;

  const yearData: YearData[] = [];

  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    let balance: number;

    if (monthlyRate === 0) {
      balance = principal + monthly * months;
    } else {
      balance =
        principal * Math.pow(1 + monthlyRate, months) +
        monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }

    const totalContributions = principal + monthly * months;
    const totalInterest = balance - totalContributions;

    yearData.push({
      year: y,
      balance,
      contributions: totalContributions,
      interest: totalInterest,
    });
  }

  const final = yearData[yearData.length - 1];
  return {
    finalBalance: final.balance,
    totalContributions: final.contributions,
    totalInterest: final.interest,
    yearData,
  };
}

const growthChartConfig = {
  contributions: { label: "Contributions", color: "var(--color-contributions)" },
  interest: { label: "Interest", color: "var(--color-interest)" },
} satisfies ChartConfig;

const compositionChartConfig = {
  contributions: { label: "Contributions", color: "var(--color-contributions)" },
  interest: { label: "Interest", color: "var(--color-interest)" },
} satisfies ChartConfig;

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(DEFAULT_PRINCIPAL);
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [years, setYears] = useState(DEFAULT_YEARS);

  const result = useMemo(
    () => calculateCompound(principal, monthly, rate, years),
    [principal, monthly, rate, years]
  );

  const sampledYears = useMemo(() => {
    const data = result.yearData;
    if (data.length <= 12) return data;
    const step = Math.ceil(data.length / 12);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [result.yearData]);

  const chartData = useMemo(
    () =>
      sampledYears.map((yd) => ({
        year: `Yr ${yd.year}`,
        contributions: Math.round(yd.contributions),
        interest: Math.round(yd.interest),
      })),
    [sampledYears]
  );

  const compositionData = useMemo(
    () => [
      { name: "Contributions", value: Math.round(result.totalContributions), fill: "var(--color-contributions)" },
      { name: "Interest", value: Math.round(result.totalInterest), fill: "var(--color-interest)" },
    ],
    [result.totalContributions, result.totalInterest]
  );

  return (
    <CalculatorShell
      title="Compound Interest Calculator"
      description="See how your money grows over time. The earlier you start, the more time does the heavy lifting."
    >
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-6">
          <CalculatorField
            id="ci-principal"
            label="Starting Principal"
            value={principal}
            onChange={setPrincipal}
            min={0}
            max={MAX_PRINCIPAL}
            step={500}
            prefix="$"
          />
          <CalculatorField
            id="ci-monthly"
            label="Monthly Contribution"
            value={monthly}
            onChange={setMonthly}
            min={0}
            max={MAX_MONTHLY}
            step={50}
            prefix="$"
          />
          <CalculatorField
            id="ci-rate"
            label="Annual Return"
            value={rate}
            onChange={setRate}
            min={0}
            max={MAX_RATE}
            step={0.5}
            suffix="%"
          />
          <CalculatorField
            id="ci-years"
            label="Investment Period"
            value={years}
            onChange={setYears}
            min={1}
            max={MAX_YEARS}
            step={1}
            suffix="yrs"
          />
        </div>

        <div className="flex flex-col gap-6">
          <StatsGrid cols={3}>
            <StatCard label="Final Balance" value={fmt$(result.finalBalance)} highlight />
            <StatCard label="Contributions" value={fmt$(result.totalContributions)} />
            <StatCard label="Interest" value={fmt$(result.totalInterest)} />
          </StatsGrid>

          {result.finalBalance > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">Balance composition</p>
              <ChartContainer
                config={compositionChartConfig}
                className="mx-auto aspect-square max-h-[160px]"
              >
                <PieChart>
                  <Pie
                    data={compositionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    strokeWidth={2}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          )}

          {result.yearData.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">Growth over time</p>
              <ChartContainer
                config={growthChartConfig}
                className="aspect-video w-full"
              >
                <AreaChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => fmt$(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="contributions"
                    type="monotone"
                    stackId="1"
                    fill="var(--color-contributions)"
                    stroke="var(--color-contributions)"
                    fillOpacity={0.6}
                  />
                  <Area
                    dataKey="interest"
                    type="monotone"
                    stackId="1"
                    fill="var(--color-interest)"
                    stroke="var(--color-interest)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </div>

      {result.totalInterest > result.totalContributions && (
        <InfoBox type="success">
          <strong>Interest earned ({fmt$(result.totalInterest)})</strong> surpasses your total contributions ({fmt$(result.totalContributions)}). That's the power of compound interest — your money earned more than you put in.
        </InfoBox>
      )}
    </CalculatorShell>
  );
}
