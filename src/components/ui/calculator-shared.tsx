"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface CalculatorFieldProps {
  id?: string
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  slider?: boolean
  className?: string
}

export function CalculatorField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix,
  suffix,
  slider = true,
  className,
}: CalculatorFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-")

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    onChange(isNaN(v) ? min : Math.max(min, Math.min(v, max)))
  }

  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  const displayValue = step < 1 ? value.toFixed(Math.ceil(Math.abs(Math.log10(step)))) : String(value)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`${inputId}-number`} className="text-sm text-muted-foreground shrink-0">
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <Input
            id={`${inputId}-number`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={displayValue}
            onChange={handleNumberChange}
            className="w-28 text-right font-heading tabular-nums"
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      {slider && (
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={handleSliderChange}
          aria-label={label}
        />
      )}
    </div>
  )
}

interface CalculatorToggleProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function CalculatorToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: CalculatorToggleProps<T>) {
  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-lg px-4 py-2.5 text-sm font-heading font-semibold transition-all duration-200 cursor-pointer",
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  highlight?: boolean
}

export function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-4 border border-border/40 shadow-sm">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={cn(
          "font-heading text-lg font-bold tabular-nums",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  )
}

interface StatsGridProps {
  children: React.ReactNode
  cols?: 2 | 3 | 4
}

export function StatsGrid({ children, cols = 3 }: StatsGridProps) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-3", colClasses[cols])}>
      {children}
    </div>
  )
}

interface InfoBoxProps {
  children: React.ReactNode
  type?: "default" | "success" | "warning" | "error"
}

export function InfoBox({ children, type = "default" }: InfoBoxProps) {
  const typeStyles = {
    default: "bg-primary/5 border-primary/10 text-primary",
    success: "bg-emerald-500/5 border-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/5 border-amber-500/10 text-amber-600",
    error: "bg-destructive/5 border-destructive/10 text-destructive",
  }

  return (
    <div className={cn("rounded-xl border p-4 text-sm", typeStyles[type])}>
      <p className="text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}

interface CalculatorShellProps {
  children: React.ReactNode
  title: string
  description?: string
  className?: string
}

export function CalculatorShell({ children, title, description, className }: CalculatorShellProps) {
  return (
    <div className={cn("rounded-2xl bg-muted/40 border border-border/30 p-6 space-y-6 shadow-sm", className)}>
      <div>
        <h3 className="font-heading text-xl font-bold mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}
