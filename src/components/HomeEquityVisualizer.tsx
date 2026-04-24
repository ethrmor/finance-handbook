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

interface MilestoneData {
  year: number;
  homeValue: number;
  loanBalance: number;
  equity: number;
  equityPct: number;
}

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

    const milestones: MilestoneData[] = [];
    const milestoneYears = [5, 10, 15, 20, 30].filter((y) => y <= loanTerm);

    for (const year of milestoneYears) {
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
      const equityPct = homeValue > 0 ? equity / homeValue : 0;

      milestones.push({
        year,
        homeValue,
        loanBalance: remainingBalance,
        equity,
        equityPct,
      });
    }

    const finalEquity =
      milestones.length > 0 ? milestones[milestones.length - 1].equity : 0;
    const totalInterest =
      monthlyPI * totalMonths - loanAmount;

    return {
      milestones,
      monthlyPI,
      totalInterest,
      finalEquity,
      loanAmount,
    };
  }, [purchasePrice, downPaymentPct, interestRate, loanTerm, annualAppreciation]);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Home Equity Visualizer</h3>
        <div className="space-y-3">
          <InputRow
            id="he-price"
            label="Purchase Price"
            value={purchasePrice}
            onChange={setPurchasePrice}
            min={0}
            max={2_000_000}
            step={10_000}
            prefix="$"
            slider
          />
          <InputRow
            id="he-down"
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
            id="he-rate"
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
            id="he-term"
            label="Loan Term"
            value={loanTerm}
            onChange={setLoanTerm}
            min={5}
            max={30}
            step={5}
            suffix="yrs"
          />
          <InputRow
            id="he-appreciation"
            label="Annual Appreciation"
            value={annualAppreciation}
            onChange={setAnnualAppreciation}
            min={-5}
            max={15}
            step={0.5}
            suffix="%"
            slider
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Monthly P&I"
          value={fmt$(result.monthlyPI)}
        />
        <StatCard
          label="Total Interest"
          value={fmt$(result.totalInterest)}
        />
        <StatCard
          label="Equity at Term End"
          value={fmt$(result.finalEquity)}
          highlight
        />
        <StatCard
          label="Loan Amount"
          value={fmt$(result.loanAmount)}
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs text-muted-foreground font-medium">
          Equity vs. Loan Balance Over Time
        </p>
        {result.milestones.map((m) => (
          <div key={m.year} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-medium">Year {m.year}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground tabular-nums">
                  Home: {fmt$(m.homeValue)}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 tabular-nums font-medium">
                  Equity: {fmt$(m.equity)}
                </span>
              </div>
            </div>
            <div className="h-5 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(0, m.equityPct) * 100}%` }}
              />
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${Math.max(0, 1 - m.equityPct) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-emerald-500" />
                Equity {Math.max(0, m.equityPct * 100).toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-sky-500" />
                Loan Balance {Math.max(0, (1 - m.equityPct) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Early mortgage payments are mostly interest — in the first years, equity builds slowly.
          As you pay down principal and the home appreciates, equity accelerates. By year 15 of a
          30-year mortgage, you&apos;ve typically built{" "}
          <strong className="text-foreground">30–50% equity</strong> through a combination of
          principal paydown and appreciation. This is why time horizon matters: selling early means
          less equity captured.
        </p>
      </div>
    </div>
  );
}
