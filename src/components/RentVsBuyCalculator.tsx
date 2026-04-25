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

const costChartConfig = {
  buyCost: { label: "Buying", color: "hsl(var(--primary))" },
  rentCost: { label: "Renting", color: "hsl(150 60% 45%)" },
} satisfies ChartConfig;

export default function RentVsBuyCalculator() {
  const [homePrice, setHomePrice] = useState(400_000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [insuranceMonthly, setInsuranceMonthly] = useState(150);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(350);
  const [monthlyRent, setMonthlyRent] = useState(2_000);
  const [rentIncreasePct, setRentIncreasePct] = useState(3);
  const [investmentReturn, setInvestmentReturn] = useState(7);
  const [yearsStaying, setYearsStaying] = useState(10);

  const result = useMemo(() => {
    const dp = homePrice * (downPaymentPct / 100);
    const loanAmount = homePrice - dp;
    const monthlyRate = mortgageRate / 100 / 12;
    const totalLoanMonths = 30 * 12;
    const stayMonths = yearsStaying * 12;

    // Monthly P&I
    let monthlyPI = 0;
    if (monthlyRate > 0 && totalLoanMonths > 0 && loanAmount > 0) {
      monthlyPI =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalLoanMonths)) /
        (Math.pow(1 + monthlyRate, totalLoanMonths) - 1);
    }

    // Remaining balance after stay
    let remainingBalance = 0;
    if (monthlyRate > 0 && loanAmount > 0) {
      remainingBalance =
        (loanAmount *
          (Math.pow(1 + monthlyRate, totalLoanMonths) -
            Math.pow(1 + monthlyRate, stayMonths))) /
        (Math.pow(1 + monthlyRate, totalLoanMonths) - 1);
    } else if (loanAmount > 0) {
      remainingBalance = Math.max(0, loanAmount - monthlyPI * stayMonths);
    }

    const totalMortgagePayments = monthlyPI * stayMonths;
    const totalPropertyTax = homePrice * (propertyTaxRate / 100) * yearsStaying;
    const totalInsurance = insuranceMonthly * 12 * yearsStaying;
    const totalMaintenance = maintenanceMonthly * 12 * yearsStaying;
    const closingCostsBuy = homePrice * 0.03;
    const closingCostsSell = homePrice * 0.06;

    // Sale proceeds (no appreciation assumed — conservative for buying)
    const saleProceeds = homePrice - remainingBalance - closingCostsSell;

    // Net cost of buying = all money out — money back from sale
    const totalBuyCost =
      dp +
      totalMortgagePayments +
      totalPropertyTax +
      totalInsurance +
      totalMaintenance +
      closingCostsBuy -
      saleProceeds;

    // Total rent paid (with annual increases)
    let totalRent = 0;
    let currentRent = monthlyRent;
    for (let y = 0; y < yearsStaying; y++) {
      totalRent += currentRent * 12;
      currentRent *= 1 + rentIncreasePct / 100;
    }

    // Opportunity cost: returns earned on down payment if invested
    const opportunityCost =
      dp * (Math.pow(1 + investmentReturn / 100, yearsStaying) - 1);

    const totalRentCost = totalRent + opportunityCost;

    // Build yearly data for chart and find breakeven
    const yearlyData: { year: number; buyCost: number; rentCost: number }[] = [];
    let breakevenYear: number | null = null;

    for (let y = 1; y <= 30; y++) {
      const yMonths = y * 12;
      const yMortgagePayments = monthlyPI * yMonths;

      let yRemaining = 0;
      if (monthlyRate > 0 && loanAmount > 0) {
        yRemaining =
          (loanAmount *
            (Math.pow(1 + monthlyRate, totalLoanMonths) -
              Math.pow(1 + monthlyRate, yMonths))) /
          (Math.pow(1 + monthlyRate, totalLoanMonths) - 1);
      } else if (loanAmount > 0) {
        yRemaining = Math.max(0, loanAmount - monthlyPI * yMonths);
      }

      const yPropTax = homePrice * (propertyTaxRate / 100) * y;
      const yIns = insuranceMonthly * 12 * y;
      const yMaint = maintenanceMonthly * 12 * y;
      const ySaleProceeds = homePrice - yRemaining - closingCostsSell;
      const yBuyCost =
        dp + yMortgagePayments + yPropTax + yIns + yMaint + closingCostsBuy - ySaleProceeds;

      let yRent = 0;
      let yCurRent = monthlyRent;
      for (let ry = 0; ry < y; ry++) {
        yRent += yCurRent * 12;
        yCurRent *= 1 + rentIncreasePct / 100;
      }
      const yOppCost = dp * (Math.pow(1 + investmentReturn / 100, y) - 1);
      const yRentCost = yRent + yOppCost;

      yearlyData.push({
        year: y,
        buyCost: Math.round(yBuyCost),
        rentCost: Math.round(yRentCost),
      });

      if (breakevenYear === null && yBuyCost <= yRentCost) {
        breakevenYear = y;
      }
    }

    return {
      totalBuyCost,
      totalRentCost,
      buyCheaper: totalBuyCost < totalRentCost,
      breakevenYear,
      totalMortgagePayments,
      totalPropertyTax,
      totalInsurance,
      totalMaintenance,
      totalRent,
      opportunityCost,
      yearlyData,
    };
  }, [
    homePrice,
    downPaymentPct,
    mortgageRate,
    propertyTaxRate,
    insuranceMonthly,
    maintenanceMonthly,
    monthlyRent,
    rentIncreasePct,
    investmentReturn,
    yearsStaying,
  ]);

  return (
    <CalculatorShell
      title="Rent vs. Buy Calculator"
      description="Compare the true cost of renting versus buying over time."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Buying
          </p>
          <CalculatorField
            id="rvb-home-price"
            label="Home Price"
            value={homePrice}
            onChange={setHomePrice}
            min={0}
            max={2_000_000}
            step={10_000}
            prefix="$"
          />
          <CalculatorField
            id="rvb-down-pct"
            label="Down Payment"
            value={downPaymentPct}
            onChange={setDownPaymentPct}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />
          <CalculatorField
            id="rvb-mortgage-rate"
            label="Mortgage Rate"
            value={mortgageRate}
            onChange={setMortgageRate}
            min={0}
            max={15}
            step={0.1}
            suffix="%"
          />
          <CalculatorField
            id="rvb-property-tax"
            label="Property Tax Rate"
            value={propertyTaxRate}
            onChange={setPropertyTaxRate}
            min={0}
            max={5}
            step={0.1}
            suffix="%"
            slider={false}
          />
          <CalculatorField
            id="rvb-insurance"
            label="Insurance / mo"
            value={insuranceMonthly}
            onChange={setInsuranceMonthly}
            min={0}
            max={1_000}
            step={10}
            prefix="$"
            slider={false}
          />
          <CalculatorField
            id="rvb-maintenance"
            label="Maintenance / mo"
            value={maintenanceMonthly}
            onChange={setMaintenanceMonthly}
            min={0}
            max={2_000}
            step={25}
            prefix="$"
            slider={false}
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Renting
          </p>
          <CalculatorField
            id="rvb-monthly-rent"
            label="Monthly Rent"
            value={monthlyRent}
            onChange={setMonthlyRent}
            min={0}
            max={10_000}
            step={50}
            prefix="$"
          />
          <CalculatorField
            id="rvb-rent-increase"
            label="Rent Increase / yr"
            value={rentIncreasePct}
            onChange={setRentIncreasePct}
            min={0}
            max={10}
            step={0.5}
            suffix="%"
            slider={false}
          />
          <CalculatorField
            id="rvb-invest-return"
            label="Invest Return"
            value={investmentReturn}
            onChange={setInvestmentReturn}
            min={0}
            max={15}
            step={0.5}
            suffix="%"
            slider={false}
          />
          <CalculatorField
            id="rvb-years"
            label="Years Staying"
            value={yearsStaying}
            onChange={setYearsStaying}
            min={1}
            max={30}
            step={1}
          />
        </div>
      </div>

      <StatsGrid cols={4}>
        <StatCard
          label="Net Buy Cost"
          value={fmt$(result.totalBuyCost)}
          highlight={result.buyCheaper}
        />
        <StatCard
          label="Net Rent Cost"
          value={fmt$(result.totalRentCost)}
          highlight={!result.buyCheaper}
        />
        <StatCard
          label="Cheaper Option"
          value={result.buyCheaper ? "Buying" : "Renting"}
          highlight
        />
        <StatCard
          label="Breakeven Year"
          value={result.breakevenYear !== null ? `Year ${result.breakevenYear}` : "30+ yrs"}
        />
      </StatsGrid>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">Cumulative Cost Over Time</p>
        <ChartContainer config={costChartConfig} className="h-[250px] w-full">
          <LineChart data={result.yearlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            <Line
              type="monotone"
              dataKey="buyCost"
              stroke="var(--color-buyCost)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rentCost"
              stroke="var(--color-rentCost)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Cost Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mortgage Interest & Principal</span>
              <span className="tabular-nums">{fmt$(result.totalMortgagePayments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Tax</span>
              <span className="tabular-nums">{fmt$(result.totalPropertyTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance</span>
              <span className="tabular-nums">{fmt$(result.totalInsurance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance</span>
              <span className="tabular-nums">{fmt$(result.totalMaintenance)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Rent Paid</span>
              <span className="tabular-nums">{fmt$(result.totalRent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investment Opportunity Cost</span>
              <span className="tabular-nums">{fmt$(result.opportunityCost)}</span>
            </div>
          </div>
        </div>
      </div>

      <InfoBox>
        {result.breakevenYear !== null ? (
          <>
            Buying becomes cheaper than renting after{" "}
            <strong className="text-foreground">year {result.breakevenYear}</strong>. If you plan to
            stay fewer than {result.breakevenYear} years, renting and investing the difference is
            likely the better financial choice. This assumes no home appreciation — actual
            appreciation could make buying favorable sooner.
          </>
        ) : (
          <>
            Under these assumptions, renting remains cheaper over 30 years. This is common in
            high-cost markets where rent is significantly lower than the full cost of ownership.
            Consider investing the savings from renting to build wealth.
          </>
        )}
      </InfoBox>
    </CalculatorShell>
  );
}
