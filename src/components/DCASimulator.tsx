import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_MONTHLY = 300;
const DEFAULT_YEARS = 20;
const DEFAULT_RATE = 10;
const DEFAULT_VOLATILITY = 1;

const MAX_MONTHLY = 5_000;
const MAX_YEARS = 40;
const MAX_RATE = 20;

const VOLATILITY_LABELS = ["Low", "Medium", "High"] as const;
const VOLATILITY_VALUES = [0.5, 1, 1.5] as const;

function fmt$(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface MonthPoint {
  month: number;
  smoothValue: number;
  volatileValue: number;
  invested: number;
}

function calculateDCA(
  monthly: number,
  years: number,
  annualRate: number,
  volatilityIdx: number
) {
  const r = annualRate / 100;
  const monthlyRate = r / 12;
  const volMultiplier = VOLATILITY_VALUES[volatilityIdx];
  const totalMonths = years * 12;

  const rand = seededRandom(42);
  const points: MonthPoint[] = [];

  let smoothBalance = 0;
  let volatileBalance = 0;
  let totalInvested = 0;

  for (let m = 1; m <= totalMonths; m++) {
    totalInvested += monthly;
    smoothBalance = smoothBalance * (1 + monthlyRate) + monthly;

    const noise = (rand() - 0.5) * 2 * volMultiplier * monthlyRate * 3;
    volatileBalance = volatileBalance * (1 + monthlyRate + noise) + monthly;
    volatileBalance = Math.max(volatileBalance, totalInvested * 0.3);

    if (m % Math.max(1, Math.floor(totalMonths / 24)) === 0 || m === totalMonths) {
      points.push({
        month: m,
        smoothValue: smoothBalance,
        volatileValue: volatileBalance,
        invested: totalInvested,
      });
    }
  }

  const finalSmooth = smoothBalance;
  const finalVolatile = volatileBalance;

  return {
    totalInvested,
    smoothFinal: finalSmooth,
    volatileFinal: finalVolatile,
    points,
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

export default function DCASimulator() {
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [volatility, setVolatility] = useState(DEFAULT_VOLATILITY);

  const result = useMemo(
    () => calculateDCA(monthly, years, rate, volatility),
    [monthly, years, rate, volatility]
  );

  const maxValue = Math.max(
    ...result.points.map((p) => Math.max(p.smoothValue, p.volatileValue)),
    1
  );

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">Dollar-Cost Averaging Simulator</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Investing a fixed amount every month smooths out market ups and downs. See how steady contributions ride through volatility.
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="dca-monthly" className="text-sm text-muted-foreground shrink-0">
                Monthly Investment
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  id="dca-monthly"
                  type="number"
                  min={0}
                  max={MAX_MONTHLY}
                  step={50}
                  value={monthly}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setMonthly(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_MONTHLY)));
                  }}
                  className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
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
              aria-label="Monthly investment"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="dca-years" className="text-sm text-muted-foreground shrink-0">
                Investment Period
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="dca-years"
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
              aria-label="Investment period"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="dca-rate" className="text-sm text-muted-foreground shrink-0">
                Assumed Annual Return
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="dca-rate"
                  type="number"
                  min={0}
                  max={MAX_RATE}
                  step={0.5}
                  value={rate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setRate(isNaN(v) ? 0 : Math.max(0, Math.min(v, MAX_RATE)));
                  }}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="dca-vol" className="text-sm text-muted-foreground shrink-0">
                Volatility
              </label>
              <span className="text-sm font-heading font-medium text-foreground tabular-nums">
                {VOLATILITY_LABELS[volatility]}
              </span>
            </div>
            <input
              id="dca-vol"
              type="range"
              min={0}
              max={2}
              step={1}
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
              aria-label="Volatility level"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Invested" value={fmt$(result.totalInvested)} />
        <StatCard label="Smooth Growth" value={fmt$(result.smoothFinal)} highlight />
        <StatCard label="With Volatility" value={fmt$(result.volatileFinal)} />
      </div>

      {result.points.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Growth trajectory: smooth path vs. actual returns with volatility
          </p>
          <div className="relative h-36 flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-border/30" />
              <div className="border-b border-border/30" />
              <div className="border-b border-border/30" />
            </div>
            {result.points.map((p, i) => {
              const smoothH = (p.smoothValue / maxValue) * 100;
              const volH = (p.volatileValue / maxValue) * 100;
              const investedH = (p.invested / maxValue) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end items-center min-w-0 gap-px relative"
                >
                  <div
                    className="w-full bg-amber-500/40 rounded-t-sm transition-all duration-300"
                    style={{ height: `${Math.max(volH, 0)}%` }}
                  />
                  <div
                    className="w-full bg-primary/70 rounded-sm transition-all duration-300 absolute"
                    style={{ height: `${Math.max(smoothH, 0)}%`, bottom: 0 }}
                  />
                  <div
                    className="w-full bg-muted-foreground/20 rounded-b-sm transition-all duration-300 absolute"
                    style={{ height: `${Math.max(investedH, 0)}%`, bottom: 0 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground tabular-nums">
            <span>Start</span>
            <span>Yr {years}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary/70 shrink-0" />
              Smooth growth
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-amber-500/40 shrink-0" />
              With volatility
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-muted-foreground/20 shrink-0" />
              Amount invested
            </span>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          With dollar-cost averaging, you invest the same amount every month regardless of price.
          When the market dips, your money buys more shares; when it rises, you buy fewer.
          Over time, this smooths out the average price you pay — and removes the stress of
          trying to time the market.
        </p>
      </div>
    </div>
  );
}
