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

interface WithdrawalResult {
  annualWithdrawal: number;
  monthlyWithdrawal: number;
  remainingAnnual: number;
  withdrawalPct: number;
}

function calculateWithdrawal(nestEgg: number): WithdrawalResult {
  const annualWithdrawal = nestEgg * 0.04;
  const monthlyWithdrawal = annualWithdrawal / 12;
  const remainingAnnual = nestEgg - annualWithdrawal;
  const withdrawalPct = 4;
  return { annualWithdrawal, monthlyWithdrawal, remainingAnnual, withdrawalPct };
}

export default function FourPercentRuleVisualizer() {
  const [nestEgg, setNestEgg] = useState(1_000_000);

  const result = useMemo(() => calculateWithdrawal(nestEgg), [nestEgg]);

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium mb-3">4% Rule Visualizer</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Enter your nest egg to see the safe annual and monthly withdrawal amounts based on the 4% rule.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="fourpct-nestegg" className="text-sm text-muted-foreground shrink-0">
              Nest Egg Amount
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="fourpct-nestegg"
                type="number"
                min={0}
                max={10_000_000}
                step={10_000}
                value={nestEgg}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setNestEgg(isNaN(v) ? 0 : Math.max(0, Math.min(v, 10_000_000)));
                }}
                className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm font-heading text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={10_000_000}
            step={10_000}
            value={nestEgg}
            onChange={(e) => setNestEgg(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Nest egg amount"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$10M</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Safe Annual Withdrawal" value={fmt$(result.annualWithdrawal)} highlight />
        <StatCard label="Safe Monthly Withdrawal" value={fmt$(result.monthlyWithdrawal)} />
        <StatCard label="Remaining After Year 1" value={fmt$(result.remainingAnnual)} />
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Withdrawal as share of nest egg</p>
        <div className="flex h-6 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 flex items-center justify-center"
            style={{ width: `${result.withdrawalPct}%` }}
          >
            <span className="text-[10px] font-heading font-semibold text-white">4%</span>
          </div>
          <div
            className="h-full bg-muted transition-all duration-300"
            style={{ width: `${100 - result.withdrawalPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 size-2.5 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Withdrawal (4%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 size-2.5 rounded-sm bg-muted" />
            <span className="text-xs text-muted-foreground">Remaining (96%)</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          The 4% rule suggests withdrawing{" "}
          <strong className="text-foreground">{fmt$(result.annualWithdrawal)}/year</strong> ({" "}
          {fmt$(result.monthlyWithdrawal)}/month) from a{" "}
          <strong className="text-foreground">{fmt$(nestEgg)}</strong> portfolio with a high probability of
          sustaining over 30 years. For longer retirements or conservative planning, consider 3–3.5% (
          {fmt$(nestEgg * 0.03)}/yr–{fmt$(nestEgg * 0.035)}/yr).
        </p>
      </div>
    </div>
  );
}
