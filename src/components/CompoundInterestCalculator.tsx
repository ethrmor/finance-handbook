import { useState, useMemo } from "react";
import { 
  CalculatorContainer, 
  CalculatorHeader, 
  StatCard, 
  StatsGrid, 
  InfoBox 
} from "@/components/ui/calculator-layouts";

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

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(DEFAULT_PRINCIPAL);
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [years, setYears] = useState(DEFAULT_YEARS);

  const result = useMemo(
    () => calculateCompound(principal, monthly, rate, years),
    [principal, monthly, rate, years]
  );

  const maxBalance = result.yearData[result.yearData.length - 1]?.balance || 1;

  const sampledYears = useMemo(() => {
    const data = result.yearData;
    if (data.length <= 12) return data;
    const step = Math.ceil(data.length / 12);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [result.yearData]);

  return (
    <CalculatorContainer variant="minimal">
      <CalculatorHeader 
        variant="minimal"
        title="Compound Interest Calculator" 
        description="See how your money grows over time. The earlier you start, the more time does the heavy lifting." 
      />

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ci-principal" className="text-sm text-muted-foreground shrink-0">
                Starting Principal
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  id="ci-principal"
                  type="number"
                  min={0}
                  max={MAX_PRINCIPAL}
                  step={500}
                  value={principal}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPrincipal(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_PRINCIPAL)));
                  }}
                  className="w-28 rounded-md border-0 border-b border-input bg-transparent px-0 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PRINCIPAL}
              step={500}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Starting principal"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ci-monthly" className="text-sm text-muted-foreground shrink-0">
                Monthly Contribution
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  id="ci-monthly"
                  type="number"
                  min={0}
                  max={MAX_MONTHLY}
                  step={50}
                  value={monthly}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setMonthly(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_MONTHLY)));
                  }}
                  className="w-28 rounded-md border-0 border-b border-input bg-transparent px-0 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_MONTHLY}
              step={50}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Monthly contribution"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ci-rate" className="text-sm text-muted-foreground shrink-0">
                Annual Return
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="ci-rate"
                  type="number"
                  min={0}
                  max={MAX_RATE}
                  step={0.5}
                  value={rate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setRate(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_RATE)));
                  }}
                  className="w-20 rounded-md border-0 border-b border-input bg-transparent px-0 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:border-primary transition-colors"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_RATE}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Annual return rate"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>20%</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ci-years" className="text-sm text-muted-foreground shrink-0">
                Investment Period
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="ci-years"
                  type="number"
                  min={1}
                  max={MAX_YEARS}
                  step={1}
                  value={years}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setYears(isNaN(v) ? 1 : Math.max(1, Math.min(v, MAX_YEARS)));
                  }}
                  className="w-20 rounded-md border-0 border-b border-input bg-transparent px-0 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:border-primary transition-colors"
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
              aria-label="Investment period in years"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 yr</span>
              <span>50 yrs</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <StatsGrid cols={3} variant="minimal">
            <StatCard variant="minimal" label="Final Balance" value={fmt$(result.finalBalance)} highlight />
            <StatCard variant="minimal" label="Contributions" value={fmt$(result.totalContributions)} />
            <StatCard variant="minimal" label="Interest" value={fmt$(result.totalInterest)} />
          </StatsGrid>

          {result.finalBalance > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Balance composition</p>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-sky-500 h-full transition-all duration-300"
                  style={{ width: `${(result.totalContributions / result.finalBalance) * 100}%` }}
                />
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(result.totalInterest / result.finalBalance) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-sky-500 shrink-0" />
                  Contributions ({((result.totalContributions / result.finalBalance) * 100).toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-primary shrink-0" />
                  Interest ({((result.totalInterest / result.finalBalance) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          )}

          {result.yearData.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Growth over time</p>
              <div className="flex items-end gap-1 h-32">
                {sampledYears.map((yd) => {
                  const contribPct = maxBalance > 0 ? (yd.contributions / maxBalance) * 100 : 0;
                  const interestPct = maxBalance > 0 ? (yd.interest / maxBalance) * 100 : 0;
                  return (
                    <div
                      key={yd.year}
                      className="flex-1 flex flex-col justify-end min-w-0"
                      title={`Year ${yd.year}: ${fmt$(yd.balance)}`}
                    >
                      <div
                        className="bg-primary/80 rounded-t-sm transition-all duration-300"
                        style={{ height: `${Math.max(interestPct, 0)}%` }}
                      />
                      <div
                        className="bg-sky-500/80 rounded-b-sm transition-all duration-300"
                        style={{ height: `${Math.max(contribPct, 0)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>Yr 1</span>
                <span>Yr {years}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {result.totalInterest > result.totalContributions && (
        <InfoBox variant="minimal" type="success">
          <strong>Interest earned ({fmt$(result.totalInterest)})</strong> surpasses your total contributions ({fmt$(result.totalContributions)}). That's the power of compound interest — your money earned more than you put in.
        </InfoBox>
      )}
    </CalculatorContainer>
  );
}
