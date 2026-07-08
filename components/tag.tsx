import { cn } from "@/lib/utils"
import { STATUS_LABEL, type Status } from "@/lib/data"

// Mill-tag building blocks: white panels with 2px ink borders and hard offset
// shadows, dashed "stitch" dividers, rotated stamp chips, indigo/thread bars.

export function TagPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("tag-panel p-5", className)}>{children}</div>
}

export function PanelHead({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b-2 border-dashed border-muted-foreground/30 pb-2.5">
      <span className="text-[11px] font-extrabold tracking-[0.22em] uppercase">{left}</span>
      {right && <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{right}</span>}
    </div>
  )
}

export function TagStamp({ status, className }: { status: Status; className?: string }) {
  const styles: Record<Status, string> = {
    flown: "border-ink text-ink rotate-2",
    booked: "border-thread text-thread -rotate-3",
    planned: "border-muted-foreground/50 text-muted-foreground -rotate-1",
  }
  return (
    <span
      className={cn(
        "inline-block border-2 px-2 py-px text-[9px] font-extrabold tracking-[0.18em] uppercase select-none",
        styles[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export interface MillBarItem {
  label: string
  value: number
  hint?: string
}

/** Horizontal bars alternating indigo / thread-orange. */
export function MillBars({ items, unit, className }: { items: MillBarItem[]; unit?: string; className?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item, i) => (
        <div key={item.label} className="grid grid-cols-[130px_1fr_88px] items-center gap-3 text-[12.5px]">
          <span className="truncate font-medium">{item.label}</span>
          <div>
            <div
              className={cn("h-3", i % 2 === 1 ? "bg-thread" : "bg-indigo-dye")}
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="text-right text-[11px] text-muted-foreground tabular-nums">
            {item.value.toLocaleString("en-IN")}
            {unit ? ` ${unit}` : ""}
            {item.hint ? ` · ${item.hint}` : ""}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Monthly columns across full history; the active period is dyed indigo, the rest stay undyed. */
export function MillColumns({
  items,
  height = 130,
  className,
}: {
  items: { label: string; value: number; selected: boolean; hint?: string }[]
  height?: number
  className?: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className={className}>
      <div className="flex items-stretch gap-[5px] border-b-2 border-ink" style={{ height }}>
        {items.map((item, i) => (
          <div key={`${item.label}-${i}`} className="group flex h-full flex-1 flex-col justify-end">
            <div
              className={cn(
                "w-full border border-ink/60 transition-colors",
                item.selected ? "bg-indigo-dye" : "bg-secondary group-hover:bg-muted-foreground/30",
              )}
              style={{ height: `${Math.max((item.value / max) * 100, 3)}%` }}
              title={item.hint ?? `${item.label} · ${item.value.toLocaleString("en-IN")} kg`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[5px]">
        {items.map((item, i) => {
          // labels are "Feb 25"-style: month on top, year underneath only when
          // it changes; every Nth labelled so narrow panels never collide
          const every = Math.max(1, Math.ceil(items.length / 10))
          const show = item.selected || i % every === 0
          const [mon, yr] = item.label.split(" ")
          const prevYr = i > 0 ? items[i - 1].label.split(" ")[1] : null
          const showYear = show && yr && (i === 0 || yr !== prevYr || item.selected)
          return (
            <span
              key={`${item.label}-${i}`}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center overflow-hidden leading-tight uppercase tabular-nums",
                item.selected ? "font-bold text-indigo-dye" : "text-muted-foreground",
              )}
            >
              <span className="w-full overflow-hidden text-[9px] whitespace-nowrap">{show ? mon : ""}</span>
              <span
                className={cn(
                  "w-full overflow-hidden text-[8px] whitespace-nowrap",
                  !item.selected && "text-muted-foreground/60",
                )}
              >
                {showYear ? `'${yr}` : ""}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
