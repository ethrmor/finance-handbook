import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-heading text-lg font-semibold tabular-nums",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function InputRow({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  slider,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  slider?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm text-muted-foreground shrink-0">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(isNaN(v) ? 0 : Math.max(min ?? -Infinity, Math.min(v, max ?? Infinity)));
            }}
            className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      {slider && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer accent-primary"
          aria-label={label}
        />
      )}
    </div>
  );
}

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

    // Breakeven year
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

      if (yBuyCost <= yRentCost) {
        breakevenYear = y;
        break;
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

  const maxCost = Math.max(Math.abs(result.totalBuyCost), Math.abs(result.totalRentCost), 1);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Rent vs. Buy Calculator</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Buying
            </p>
            <InputRow
              id="rvb-home-price"
              label="Home Price"
              value={homePrice}
              onChange={setHomePrice}
              min={0}
              max={2_000_000}
              step={10_000}
              prefix="$"
              slider
            />
            <InputRow
              id="rvb-down-pct"
              label="Down Payment"
              value={downPaymentPct}
              onChange={setDownPaymentPct}
              min={0}
              max={100}
              step={1}
              suffix="%"
              slider
            />
            <InputRow
              id="rvb-mortgage-rate"
              label="Mortgage Rate"
              value={mortgageRate}
              onChange={setMortgageRate}
              min={0}
              max={15}
              step={0.1}
              suffix="%"
              slider
            />
            <InputRow
              id="rvb-property-tax"
              label="Property Tax Rate"
              value={propertyTaxRate}
              onChange={setPropertyTaxRate}
              min={0}
              max={5}
              step={0.1}
              suffix="%"
            />
            <InputRow
              id="rvb-insurance"
              label="Insurance / mo"
              value={insuranceMonthly}
              onChange={setInsuranceMonthly}
              min={0}
              max={1_000}
              step={10}
              prefix="$"
            />
            <InputRow
              id="rvb-maintenance"
              label="Maintenance / mo"
              value={maintenanceMonthly}
              onChange={setMaintenanceMonthly}
              min={0}
              max={2_000}
              step={25}
              prefix="$"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Renting
            </p>
            <InputRow
              id="rvb-monthly-rent"
              label="Monthly Rent"
              value={monthlyRent}
              onChange={setMonthlyRent}
              min={0}
              max={10_000}
              step={50}
              prefix="$"
              slider
            />
            <InputRow
              id="rvb-rent-increase"
              label="Rent Increase / yr"
              value={rentIncreasePct}
              onChange={setRentIncreasePct}
              min={0}
              max={10}
              step={0.5}
              suffix="%"
            />
            <InputRow
              id="rvb-invest-return"
              label="Invest Return"
              value={investmentReturn}
              onChange={setInvestmentReturn}
              min={0}
              max={15}
              step={0.5}
              suffix="%"
            />
            <InputRow
              id="rvb-years"
              label="Years Staying"
              value={yearsStaying}
              onChange={setYearsStaying}
              min={1}
              max={30}
              step={1}
              slider
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">Net Cost Comparison</p>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Buying</span>
              <span className="font-heading font-medium tabular-nums">
                {fmt$(result.totalBuyCost)}
              </span>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  result.buyCheaper ? "bg-primary" : "bg-sky-500"
                )}
                style={{ width: `${(Math.abs(result.totalBuyCost) / maxCost) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Renting</span>
              <span className="font-heading font-medium tabular-nums">
                {fmt$(result.totalRentCost)}
              </span>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  !result.buyCheaper ? "bg-primary" : "bg-emerald-500"
                )}
                style={{ width: `${(Math.abs(result.totalRentCost) / maxCost) * 100}%` }}
              />
            </div>
          </div>
        </div>
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

      {result.breakevenYear !== null && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Buying becomes cheaper than renting after{" "}
            <strong className="text-foreground">year {result.breakevenYear}</strong>. If you plan to
            stay fewer than {result.breakevenYear} years, renting and investing the difference is
            likely the better financial choice. This assumes no home appreciation — actual
            appreciation could make buying favorable sooner.
          </p>
        </div>
      )}
      {result.breakevenYear === null && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Under these assumptions, renting remains cheaper over 30 years. This is common in
            high-cost markets where rent is significantly lower than the full cost of ownership.
            Consider investing the savings from renting to build wealth.
          </p>
        </div>
      )}
    </div>
  );
}
