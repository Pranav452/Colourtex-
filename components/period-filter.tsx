"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { MONTH_NAMES } from "@/lib/stats"
import { cn } from "@/lib/utils"

export interface PeriodOption {
  year: number
  months: number[]
}

// Global dashboard period filter. Writes ?year=&month= to the URL — the server
// page recomputes every figure for the selection. "All time" clears both.
export function PeriodFilter({
  periods,
  year,
  month,
  className,
}: {
  periods: PeriodOption[]
  year: number | null
  month: number | null
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const apply = (y: number | null, m: number | null) => {
    const params = new URLSearchParams()
    if (y !== null) params.set("year", String(y))
    if (y !== null && m !== null) params.set("month", String(m))
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false }))
  }

  const activeYear = periods.find((p) => p.year === year)
  const selectCls =
    "tag-shadow-sm h-9 border-2 border-ink bg-card px-2.5 text-[11px] font-extrabold tracking-[0.12em] uppercase focus:outline-none focus:border-indigo-dye"

  return (
    <div className={cn("flex flex-wrap items-center gap-2", pending && "opacity-60", className)}>
      <span className="text-[9px] font-bold tracking-[0.24em] text-muted-foreground uppercase">Show lot</span>

      <select
        aria-label="Year"
        className={selectCls}
        value={year === null ? "all" : String(year)}
        onChange={(e) => apply(e.target.value === "all" ? null : Number(e.target.value), null)}
      >
        <option value="all">All time</option>
        {periods.map((p) => (
          <option key={p.year} value={p.year}>
            {p.year}
          </option>
        ))}
      </select>

      <select
        aria-label="Month"
        className={cn(selectCls, year === null && "cursor-not-allowed opacity-45")}
        disabled={year === null}
        value={month === null ? "all" : String(month)}
        onChange={(e) => apply(year, e.target.value === "all" ? null : Number(e.target.value))}
      >
        <option value="all">Whole year</option>
        {(activeYear?.months ?? []).map((m) => (
          <option key={m} value={m}>
            {MONTH_NAMES[m - 1]}
          </option>
        ))}
      </select>

      {(year !== null || month !== null) && (
        <button
          onClick={() => apply(null, null)}
          className="border-2 border-thread px-2 py-1.5 text-[9px] font-extrabold tracking-[0.16em] text-thread uppercase transition-colors hover:bg-thread hover:text-primary-foreground"
        >
          Clear
        </button>
      )}
    </div>
  )
}
