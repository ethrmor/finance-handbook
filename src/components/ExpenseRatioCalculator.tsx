import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_PORTFOLIO = 100_000;
const DEFAULT_FEE_A = 0.03;
const DEFAULT_FEE_B = 1.0;
const DEFAULT_YEARS = 30;
const DEFAULT_RETURN = 8;

const MAX_PORTFOLIO = 2_000_000;
const MAX_YEARS = 40;
const MAX_RETURN = 15;

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
  fundA: number;
  fundB: number;
}

function calculateExpenseRatio(
  portfolio: number,
  feeA: number,
  feeB: number,
  years: number,
  annualReturn: number
) {
  const r = annualReturn / 100;
  const fA = feeA / 100;
  const fB = feeB / 100;

  const yearData: YearData[] = [];
  let valA = portfolio;
  let valB = portfolio;

  for (let y = 1; y <= years; y++) {
    valA = valA * (1 + r - fA);
    valB = valB * (1 + r - fB);
    yearData.push({ year: y, fundA: valA, fundB: valB });
  }

  const diff = valA - valB;

  return {
    finalA: valA,
    finalB: valB,
    difference: diff,
    yearData,
  };
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
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

export default function ExpenseRatioCalculator() {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [feeA, setFeeA] = useState(DEFAULT_FEE_A);
  const [feeB, setFeeB] = useState(DEFAULT_FEE_B);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [annualReturn, setAnnualReturn] = useState(DEFAULT_RETURN);

  const result = useMemo(
    () => calculateExpenseRatio(portfolio, feeA, feeB, years, annualReturn),
    [portfolio, feeA, feeB, years, annualReturn]
  );

  const maxFinal = Math.max(result.finalA, result.finalB, 1);

  const sampledYears = useMemo(() => {
    const data = result.yearData;
    if (data.length <= 10) return data;
    const step = Math.ceil(data.length / 10);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [result.yearData]);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Expense Ratio Impact Calculator</h3>
        <p className="text-xs text-muted-foreground mb-4">
          A small difference in fees compounds into a massive gap over decades. See what that 1% really costs you.
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="er-portfolio" className="text-sm text-muted-foreground shrink-0">
                Portfolio Value
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  id="er-portfolio"
                  type="number"
                  min={0}
                  max={MAX_PORTFOLIO}
                  step={5000}
                  value={portfolio}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPortfolio(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_PORTFOLIO)));
                  }}
                  className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PORTFOLIO}
              step={5000}
              value={portfolio}
              onChange={(e) => setPortfolio(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Portfolio value"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="er-feeA" className="text-sm text-muted-foreground shrink-0">
                Fund A Expense Ratio
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="er-feeA"
                  type="number"
                  min={0}
                  max={3}
                  step={0.01}
                  value={feeA}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setFeeA(isNaN(v) ? 0 : Math.max(0, Math.min(v, 3)));
                  }}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.01}
              value={feeA}
              onChange={(e) => setFeeA(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Fund A expense ratio"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>3%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="er-feeB" className="text-sm text-muted-foreground shrink-0">
                Fund B Expense Ratio
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="er-feeB"
                  type="number"
                  min={0}
                  max={3}
                  step={0.01}
                  value={feeB}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setFeeB(isNaN(v) ? 0 : Math.max(0, Math.min(v, 3)));
                  }}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.01}
              value={feeB}
              onChange={(e) => setFeeB(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Fund B expense ratio"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>3%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="er-years" className="text-sm text-muted-foreground shrink-0">
                Time Horizon
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="er-years"
                  type="number"
                  min={1}
                  max={MAX_YEARS}
                  step={1}
                  value={years}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setYears(isNaN(v) ? 1 : Math.max(1, Math.min(v, MAX_YEARS)));
                  }}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <span className="text-sm text-muted-foreground">yrs</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={MAX_YEARS}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Time horizon"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="er-return" className="text-sm text-muted-foreground shrink-0">
                Expected Annual Return
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="er-return"
                  type="number"
                  min={0}
                  max={MAX_RETURN}
                  step={0.5}
                  value={annualReturn}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setAnnualReturn(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_RETURN)));
                  }}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_RETURN}
              step={0.5}
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Expected annual return"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Fund A Final Value" value={fmt$(result.finalA)} highlight />
        <StatCard label="Fund B Final Value" value={fmt$(result.finalB)} />
        <StatCard
          label="Fee Cost Difference"
          value={fmt$(result.difference)}
          highlight={result.difference > 0}
        />
      </div>

      {result.difference > 0 && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fund B&apos;s higher fee costs you <strong className="text-foreground">{fmt$(result.difference)}</strong> over{" "}
            {years} years. That&apos;s <strong className="text-foreground">
              {((result.difference / result.finalA) * 100).toFixed(1)}%
            </strong>{" "}
            of your potential portfolio — money that went to fees instead of your future.
          </p>
        </div>
      )}

      {result.finalA > 0 && result.finalB > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Final portfolio comparison after {years} years
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  Fund A ({feeA.toFixed(2)}% fee)
                </span>
                <span className="text-xs font-heading font-medium tabular-nums text-foreground">
                  {fmt$(result.finalA)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${(result.finalA / maxFinal) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  Fund B ({feeB.toFixed(2)}% fee)
                </span>
                <span className="text-xs font-heading font-medium tabular-nums text-foreground">
                  {fmt$(result.finalB)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(result.finalB / maxFinal) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary shrink-0" />
              Lower fee
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-amber-500 shrink-0" />
              Higher fee
            </span>
          </div>
        </div>
      )}

      {sampledYears.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            How the gap widens over time
          </p>
          <div className="flex items-end gap-1 h-32">
            {sampledYears.map((yd) => {
              const hA = maxFinal > 0 ? (yd.fundA / maxFinal) * 100 : 0;
              const hB = maxFinal > 0 ? (yd.fundB / maxFinal) * 100 : 0;
              return (
                <div
                  key={yd.year}
                  className="flex-1 flex flex-col justify-end min-w-0"
                  title={`Year ${yd.year}: Fund A ${fmt$(yd.fundA)} / Fund B ${fmt$(yd.fundB)}`}
                >
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="bg-primary/60 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(hA, 0)}%` }}
                    />
                  </div>
                  <div
                    className="bg-amber-500/60 rounded-b-sm transition-all duration-300"
                    style={{ height: `${Math.max(hB, 0)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground tabular-nums">
            <span>Yr 1</span>
            <span>Yr {years}</span>
          </div>
        </div>
      )}
    </div>
  );
}
