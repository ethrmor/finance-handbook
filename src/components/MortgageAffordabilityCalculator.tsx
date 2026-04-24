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

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
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

function RatioGauge({
  label,
  ratio,
  healthyThreshold,
  cautionThreshold,
}: {
  label: string;
  ratio: number;
  healthyThreshold: number;
  cautionThreshold: number;
}) {
  const status =
    ratio <= healthyThreshold
      ? ("healthy" as const)
      : ratio <= cautionThreshold
        ? ("caution" as const)
        : ("risky" as const);

  const statusColor = {
    healthy: "bg-emerald-500",
    caution: "bg-amber-500",
    risky: "bg-red-500",
  };

  const statusText = {
    healthy: "text-emerald-700 dark:text-emerald-400",
    caution: "text-amber-700 dark:text-amber-400",
    risky: "text-red-700 dark:text-red-400",
  };

  const statusLabel = {
    healthy: "Healthy",
    caution: "Caution",
    risky: "Risky",
  };

  const fillPct = Math.min(100, (ratio / cautionThreshold) * 100);

  return (
    <div className="rounded-lg bg-background p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        <span
          className={cn("text-xs font-medium", statusText[status])}
        >
          {statusLabel[status]}
        </span>
      </div>
      <div className="font-heading text-lg font-semibold tabular-nums mb-2">
        {fmtPct(ratio)}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", statusColor[status])}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{fmtPct(healthyThreshold)}</span>
        <span>{fmtPct(cautionThreshold)}</span>
      </div>
    </div>
  );
}

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

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">
          Mortgage Affordability Calculator
        </h3>
        <div className="space-y-3">
          <InputRow
            id="ma-income"
            label="Gross Annual Income"
            value={grossAnnualIncome}
            onChange={setGrossAnnualIncome}
            min={0}
            max={1_000_000}
            step={5_000}
            prefix="$"
            slider
          />
          <InputRow
            id="ma-debts"
            label="Monthly Non-Housing Debts"
            value={monthlyDebts}
            onChange={setMonthlyDebts}
            min={0}
            max={5_000}
            step={50}
            prefix="$"
          />
          <InputRow
            id="ma-down"
            label="Down Payment"
            value={downPayment}
            onChange={setDownPayment}
            min={0}
            max={500_000}
            step={5_000}
            prefix="$"
            slider
          />
          <InputRow
            id="ma-rate"
            label="Interest Rate"
            value={interestRate}
            onChange={setInterestRate}
            min={0}
            max={15}
            step={0.1}
            suffix="%"
            slider
          />
          <InputRow
            id="ma-term"
            label="Loan Term"
            value={loanTerm}
            onChange={setLoanTerm}
            min={5}
            max={30}
            step={5}
            suffix="yrs"
            slider
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Max Home Price" value={fmt$(result.maxHomePrice)} highlight />
        <StatCard label="Monthly PITI" value={fmt$(result.monthlyPITI)} />
        <StatCard
          label="Front-End Ratio"
          value={fmtPct(result.frontEndRatio)}
        />
        <StatCard
          label="Back-End Ratio"
          value={fmtPct(result.backEndRatio)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RatioGauge
          label="Front-End Ratio (Housing / Income)"
          ratio={result.frontEndRatio}
          healthyThreshold={0.28}
          cautionThreshold={0.32}
        />
        <RatioGauge
          label="Back-End Ratio (Total Debt / Income)"
          ratio={result.backEndRatio}
          healthyThreshold={0.36}
          cautionThreshold={0.42}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Monthly PITI Breakdown</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Principal & Interest</span>
            <span className="tabular-nums">{fmt$(result.actualPI)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property Tax (est. 1.2%)</span>
            <span className="tabular-nums">{fmt$(result.propertyTaxMonthly)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Insurance (est. 0.4%)</span>
            <span className="tabular-nums">{fmt$(result.insuranceMonthly)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Total PITI</span>
            <span className="tabular-nums">{fmt$(result.monthlyPITI)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Lenders typically require a{" "}
          <strong className="text-foreground">front-end ratio ≤ 28%</strong> (housing costs vs.
          income) and a{" "}
          <strong className="text-foreground">back-end ratio ≤ 36%</strong> (total debt vs. income).
          Just because a bank approves you doesn&apos;t mean you should borrow the maximum — aim for
          housing costs under 25% of gross income to leave room for other goals.
        </p>
      </div>
    </div>
  );
}
