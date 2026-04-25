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
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

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

const ratioChartConfig = {
  ratio: { label: "Ratio", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const pitiChartConfig = {
  amount: { label: "Amount", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function MortgageAffordabilityCalculator() {
  const [grossAnnualIncome, setGrossAnnualIncome] = useState(80_000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPayment, setDownPayment] = useState(60_000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);

  const result = useMemo(() => {
    const monthlyGross = grossAnnualIncome / 12;

    // Front-end limit: housing costs ≤ 28% of gross monthly income
    const maxHousingFront = monthlyGross * 0.28;
    // Back-end limit: total debt ≤ 36% of gross monthly income
    const maxHousingBack = monthlyGross * 0.36 - monthlyDebts;

    const maxPITI = Math.max(0, Math.min(maxHousingFront, maxHousingBack));

    // Estimate TI (property tax + insurance) as ~1.6% of home price / 12
    // We iterate: assume TI ≈ 25% of PITI initially
    const estimatedTI = maxPITI * 0.25;
    const maxPI = Math.max(0, maxPITI - estimatedTI);

    // Calculate max loan from max monthly P&I
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTerm * 12;

    let maxLoan = 0;
    if (monthlyRate > 0 && totalMonths > 0 && maxPI > 0) {
      maxLoan =
        (maxPI * (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
    } else if (maxPI > 0) {
      maxLoan = maxPI * totalMonths;
    }

    const maxHomePrice = maxLoan + downPayment;

    // Recalculate actual PITI based on max home price
    const actualLoan = Math.max(0, maxHomePrice - downPayment);
    let actualPI = 0;
    if (monthlyRate > 0 && totalMonths > 0 && actualLoan > 0) {
      actualPI =
        (actualLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const propertyTaxMonthly = maxHomePrice * 0.012 / 12;
    const insuranceMonthly = maxHomePrice * 0.004 / 12;
    const actualPITI = actualPI + propertyTaxMonthly + insuranceMonthly;

    const frontEndRatio = monthlyGross > 0 ? actualPITI / monthlyGross : 0;
    const backEndRatio =
      monthlyGross > 0 ? (actualPITI + monthlyDebts) / monthlyGross : 0;

    return {
      maxHomePrice,
      monthlyPITI: actualPITI,
      frontEndRatio,
      backEndRatio,
      actualPI,
      propertyTaxMonthly,
      insuranceMonthly,
    };
  }, [grossAnnualIncome, monthlyDebts, downPayment, interestRate, loanTerm]);

  const ratioData = [
    { name: "Front-End", ratio: +(result.frontEndRatio * 100).toFixed(1) },
    { name: "Back-End", ratio: +(result.backEndRatio * 100).toFixed(1) },
  ];

  const pitiData = [
    { name: "P&I", amount: Math.round(result.actualPI) },
    { name: "Tax", amount: Math.round(result.propertyTaxMonthly) },
    { name: "Insurance", amount: Math.round(result.insuranceMonthly) },
  ];

  return (
    <CalculatorShell
      title="Mortgage Affordability Calculator"
      description="Estimate how much home you can afford based on your income and debts."
    >
      <div className="space-y-3">
        <CalculatorField
          id="ma-income"
          label="Gross Annual Income"
          value={grossAnnualIncome}
          onChange={setGrossAnnualIncome}
          min={0}
          max={1_000_000}
          step={5_000}
          prefix="$"
        />
        <CalculatorField
          id="ma-debts"
          label="Monthly Non-Housing Debts"
          value={monthlyDebts}
          onChange={setMonthlyDebts}
          min={0}
          max={5_000}
          step={50}
          prefix="$"
          slider={false}
        />
        <CalculatorField
          id="ma-down"
          label="Down Payment"
          value={downPayment}
          onChange={setDownPayment}
          min={0}
          max={500_000}
          step={5_000}
          prefix="$"
        />
        <CalculatorField
          id="ma-rate"
          label="Interest Rate"
          value={interestRate}
          onChange={setInterestRate}
          min={0}
          max={15}
          step={0.1}
          suffix="%"
        />
        <CalculatorField
          id="ma-term"
          label="Loan Term"
          value={loanTerm}
          onChange={setLoanTerm}
          min={5}
          max={30}
          step={5}
          suffix="yrs"
        />
      </div>

      <StatsGrid cols={4}>
        <StatCard label="Max Home Price" value={fmt$(result.maxHomePrice)} highlight />
        <StatCard label="Monthly PITI" value={fmt$(result.monthlyPITI)} />
        <StatCard label="Front-End Ratio" value={fmtPct(result.frontEndRatio)} />
        <StatCard label="Back-End Ratio" value={fmtPct(result.backEndRatio)} />
      </StatsGrid>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">DTI Ratios vs. Thresholds</p>
        <ChartContainer config={ratioChartConfig} className="h-[200px] w-full">
          <BarChart data={ratioData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis unit="%" tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={28} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="28%" />
            <ReferenceLine y={36} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="36%" />
            <Bar dataKey="ratio" fill="var(--color-ratio)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">Monthly PITI Breakdown</p>
        <ChartContainer config={pitiChartConfig} className="h-[180px] w-full">
          <BarChart data={pitiData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v: number) => `$${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      <InfoBox>
        Lenders typically require a{" "}
        <strong className="text-foreground">front-end ratio ≤ 28%</strong> (housing costs vs.
        income) and a{" "}
        <strong className="text-foreground">back-end ratio ≤ 36%</strong> (total debt vs. income).
        Just because a bank approves you doesn&apos;t mean you should borrow the maximum — aim for
        housing costs under 25% of gross income to leave room for other goals.
      </InfoBox>
    </CalculatorShell>
  );
}
