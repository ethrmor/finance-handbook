import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon } from "@hugeicons/core-free-icons"

interface NavItem {
  title: string
  href: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

interface MobileNavProps {
  currentPath?: string
  sections: NavSection[]
  dailyTip: string
}

export function MobileNav({ currentPath, sections, dailyTip }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const isTopicsPage = currentPath === "/topics" || currentPath?.startsWith("/topics/")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <HugeiconsIcon icon={Menu01Icon} className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-4 pb-2 pt-6">
            <a href="/" onClick={() => setOpen(false)}>
              <SheetTitle className="font-heading text-lg tracking-tight">
                Financial Handbook
              </SheetTitle>
            </a>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Personal finance explained in plain English.
            </p>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-4 py-2">
            {sections.map((section) => (
              <div key={section.label} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px w-3 bg-primary/40" />
                  <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
                    {section.label}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = currentPath === item.href
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`group flex items-baseline py-1.5 px-2 -mx-2 rounded-md text-sm transition-all ${
                          isActive
                            ? "bg-primary/8 text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <span className="relative">
                          {item.title}
                          {!isActive && (
                            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary/60 transition-all duration-200 group-hover:w-full" />
                          )}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}

            <a
              href="/topics"
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-2 py-2 px-2 -mx-2 rounded-md text-sm transition-all mb-2 ${
                isTopicsPage
                  ? "bg-primary/8 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <span className="relative">
                Browse all topics
                {!isTopicsPage && (
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary/60 transition-all duration-200 group-hover:w-full" />
                )}
              </span>
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                />
              </svg>
            </a>
          </nav>

          <div className="px-4 pb-4 pt-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider mb-2">
                Daily Tip
              </p>
              <p className="text-xs text-foreground leading-relaxed">{dailyTip}</p>
            </div>
          </div>

          <div className="px-4 pb-6 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              A practical guide to personal finance.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
