import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  variant?: "default" | "card" | "minimal" | "elevated";
}

export function StatCard({ label, value, highlight, variant = "default" }: StatCardProps) {
  const variants = {
    default: "rounded-lg bg-background p-3",
    card: "rounded-xl bg-background border border-border/50 p-4 shadow-sm",
    minimal: "py-2 border-b border-border/30 last:border-0",
    elevated: "rounded-xl bg-primary/5 border border-primary/10 p-4",
  };

  const labelVariants = {
    default: "text-xs text-muted-foreground",
    card: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
    minimal: "text-xs text-muted-foreground mb-1",
    elevated: "text-xs font-medium text-primary/80 uppercase tracking-wide",
  };

  const valueVariants = {
    default: cn(
      "font-heading text-lg font-semibold tabular-nums",
      highlight ? "text-primary" : "text-foreground"
    ),
    card: cn(
      "font-heading text-xl font-bold tabular-nums mt-1",
      highlight ? "text-primary" : "text-foreground"
    ),
    minimal: cn(
      "font-heading text-base font-medium tabular-nums",
      highlight ? "text-foreground" : "text-muted-foreground"
    ),
    elevated: cn(
      "font-heading text-xl font-bold tabular-nums mt-1",
      highlight ? "text-primary" : "text-foreground"
    ),
  };

  return (
    <div className={variants[variant]}>
      <div className={labelVariants[variant]}>{label}</div>
      <div className={valueVariants[variant]}>{value}</div>
    </div>
  );
}

interface CalculatorContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "card" | "minimal" | "elevated";
}

export function CalculatorContainer({ 
  children, 
  className, 
  variant = "default" 
}: CalculatorContainerProps) {
  const variants = {
    default: "bg-muted/50 rounded-lg p-6 space-y-6",
    card: "bg-background rounded-2xl border border-border/60 p-6 space-y-6 shadow-sm",
    minimal: "p-6 space-y-8",
    elevated: "bg-gradient-to-br from-background to-muted/30 rounded-2xl border border-border/40 p-6 space-y-6 shadow-lg shadow-primary/5",
  };

  return <div className={cn(variants[variant], className)}>{children}</div>;
}

interface CalculatorHeaderProps {
  title: string;
  description?: string;
  variant?: "default" | "card" | "minimal" | "elevated";
}

export function CalculatorHeader({ title, description, variant = "default" }: CalculatorHeaderProps) {
  const containerVariants = {
    default: "mb-1",
    card: "pb-4 border-b border-border/50 mb-2",
    minimal: "mb-2",
    elevated: "bg-gradient-to-r from-primary/10 to-transparent -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-2xl mb-4",
  };

  const titleVariants = {
    default: "font-heading text-lg font-medium mb-1",
    card: "font-heading text-xl font-bold mb-2",
    minimal: "font-heading text-lg font-medium mb-1 tracking-tight",
    elevated: "font-heading text-xl font-bold mb-2 text-foreground",
  };

  const descVariants = {
    default: "text-xs text-muted-foreground",
    card: "text-sm text-muted-foreground leading-relaxed",
    minimal: "text-sm text-muted-foreground leading-relaxed max-w-prose",
    elevated: "text-sm text-muted-foreground/80 leading-relaxed max-w-prose",
  };

  return (
    <div className={containerVariants[variant]}>
      <h3 className={titleVariants[variant]}>{title}</h3>
      {description && <p className={descVariants[variant]}>{description}</p>}
    </div>
  );
}

interface InputSectionProps {
  children: React.ReactNode;
  variant?: "default" | "card" | "minimal" | "elevated";
}

export function InputSection({ children, variant = "default" }: InputSectionProps) {
  const variants = {
    default: "space-y-4",
    card: "space-y-5 bg-muted/30 rounded-xl p-5",
    minimal: "space-y-6",
    elevated: "space-y-5 bg-background/60 rounded-xl p-5 border border-border/30",
  };

  return <div className={variants[variant]}>{children}</div>;
}

interface StatsGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  variant?: "default" | "card" | "minimal" | "elevated";
}

export function StatsGrid({ children, cols = 3, variant = "default" }: StatsGridProps) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  const variants = {
    default: cn("grid gap-3", colClasses[cols as keyof typeof colClasses]),
    card: cn("grid gap-4", colClasses[cols as keyof typeof colClasses]),
    minimal: cn("grid gap-6 divide-y sm:divide-y-0", colClasses[cols as keyof typeof colClasses]),
    elevated: cn("grid gap-4", colClasses[cols as keyof typeof colClasses]),
  };

  return <div className={variants[variant]}>{children}</div>;
}

interface InfoBoxProps {
  children: React.ReactNode;
  type?: "default" | "success" | "warning" | "error";
  variant?: "default" | "card" | "minimal" | "elevated";
}

export function InfoBox({ children, type = "default", variant = "default" }: InfoBoxProps) {
  const typeStyles = {
    default: {
      default: "bg-primary/5 border border-primary/10",
      card: "bg-primary/5 border border-primary/20 rounded-xl",
      minimal: "border-l-2 border-primary/50 pl-4 py-2",
      elevated: "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl",
    },
    success: {
      default: "bg-emerald-500/5 border border-emerald-500/10",
      card: "bg-emerald-500/5 border border-emerald-500/20 rounded-xl",
      minimal: "border-l-2 border-emerald-500/50 pl-4 py-2",
      elevated: "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl",
    },
    warning: {
      default: "bg-amber-500/5 border border-amber-500/10",
      card: "bg-amber-500/5 border border-amber-500/20 rounded-xl",
      minimal: "border-l-2 border-amber-500/50 pl-4 py-2",
      elevated: "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl",
    },
    error: {
      default: "bg-destructive/5 border border-destructive/10",
      card: "bg-destructive/5 border border-destructive/20 rounded-xl",
      minimal: "border-l-2 border-destructive/50 pl-4 py-2",
      elevated: "bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-xl",
    },
  };

  const textStyles = {
    default: variant === "minimal" ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground leading-relaxed",
    card: "text-sm text-muted-foreground leading-relaxed",
    minimal: "text-sm text-muted-foreground leading-relaxed",
    elevated: "text-sm text-muted-foreground/80 leading-relaxed",
  };

  return (
    <div className={cn("p-4", typeStyles[type][variant])}>
      <p className={textStyles[variant]}>{children}</p>
    </div>
  );
}
