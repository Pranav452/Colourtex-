"use client"

import { useMemo, useState } from "react"

import { TagStamp } from "@/components/tag"
import { STATUS_LABEL, type Status } from "@/lib/data"
import { DESTINATIONS, airlineName } from "@/lib/airports"
import { fmt, fmtDateShort, type ShipmentWithStatus } from "@/lib/stats"
import { cn } from "@/lib/utils"

const STATUS_TABS: (Status | "all")[] = ["all", "flown", "booked"]
const PAGE_SIZE = 15

export function ShipmentsTable({
  shipments,
  periodLabel,
}: {
  shipments: ShipmentWithStatus[]
  periodLabel: string
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<Status | "all">("all")
  const [dest, setDest] = useState("all")
  const [page, setPage] = useState(0)

  const dests = useMemo(
    () => [...new Set(shipments.map((s) => s.destination))].sort(),
    [shipments],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shipments.filter((s) => {
      if (status !== "all" && s.status !== status) return false
      if (dest !== "all" && s.destination !== dest) return false
      if (!q) return true
      const haystack = [
        s.awb, s.consignee, s.destination, s.invoice ?? "",
        ...s.legs.map((l) => `${l.carrier}${l.flightNo}`),
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [shipments, query, status, dest])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <div className="tag-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-muted-foreground/30 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-extrabold tracking-[0.22em] uppercase">The manifest</span>
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
            {rows.length} of {shipments.length} · {periodLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatus(tab); setPage(0); }}
                className={cn(
                  "border-2 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.16em] uppercase transition-colors",
                  status === tab
                    ? "border-ink bg-ink text-card"
                    : "border-ink/25 text-muted-foreground hover:border-ink hover:text-ink",
                )}
              >
                {tab === "all" ? "All" : STATUS_LABEL[tab]}
              </button>
            ))}
          </div>

          <select
            value={dest}
            onChange={(e) => { setDest(e.target.value); setPage(0); }}
            className="h-8 border-2 border-ink/30 bg-card px-2 text-[10px] font-bold tracking-[0.1em] uppercase focus:border-indigo-dye focus:outline-none"
            aria-label="Filter by destination"
          >
            <option value="all">All lanes</option>
            {dests.map((d) => (
              <option key={d} value={d}>
                {DESTINATIONS[d] ? `${DESTINATIONS[d].city} (${DESTINATIONS[d].iata})` : d}
              </option>
            ))}
          </select>

          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="SEARCH AWB · CONSIGNEE · FLIGHT…"
            className="h-8 w-60 border-2 border-ink/30 bg-card px-2.5 text-[10px] font-bold tracking-[0.08em] uppercase placeholder:text-muted-foreground/50 focus:border-indigo-dye focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
              <th className="border-b-2 border-ink py-2 pr-3 font-extrabold">AWB</th>
              <th className="border-b-2 border-ink py-2 pr-3 font-extrabold">Date</th>
              <th className="border-b-2 border-ink py-2 pr-3 font-extrabold">Consignee</th>
              <th className="border-b-2 border-ink py-2 pr-3 font-extrabold">Lane</th>
              <th className="border-b-2 border-ink py-2 pr-3 font-extrabold">Flights</th>
              <th className="border-b-2 border-ink py-2 pr-3 text-right font-extrabold">Pkg</th>
              <th className="border-b-2 border-ink py-2 pr-3 text-right font-extrabold">Chg. kg</th>
              <th className="border-b-2 border-ink py-2 pr-3 font-extrabold">Cleared</th>
              <th className="border-b-2 border-ink py-2 font-extrabold">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => {
              const ap = DESTINATIONS[s.destination]
              return (
                <tr key={s.awb + s.date} className="border-b border-border align-middle transition-colors hover:bg-secondary/60">
                  <td className="py-2.5 pr-3">
                    <div className="font-mono text-[11.5px] font-bold">{s.awb}</div>
                    <div className="text-[9.5px] tracking-[0.06em] text-muted-foreground uppercase">
                      {s.invoice ?? "—"}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-[11.5px] tabular-nums">{fmtDateShort(s.date)}</td>
                  <td className="max-w-48 py-2.5 pr-3">
                    <span className="block truncate font-semibold">{s.consignee}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-[11px] font-extrabold text-indigo-dye">{ap?.iata ?? "—"}</span>
                    <span className="text-[10.5px] text-muted-foreground"> {ap ? ap.city : s.destination}</span>
                  </td>
                  <td className="max-w-44 py-2.5 pr-3">
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.legs.map((l) => `${l.carrier}${l.flightNo}`).join(" → ") || "—"}
                    </span>
                    <span className="text-[9.5px] text-muted-foreground/70">
                      {s.legs[0] ? airlineName(s.legs[0].carrier) : ""}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{s.pkgs}</td>
                  <td className="py-2.5 pr-3 text-right font-bold tabular-nums">{fmt(s.chargeableWt)}</td>
                  <td className={cn("py-2.5 pr-3 text-[11px] tabular-nums", !s.clearanceDate && "text-thread")}>
                    {s.clearanceDate ? fmtDateShort(s.clearanceDate) : "PENDING"}
                  </td>
                  <td className="py-2.5">
                    <TagStamp status={s.status} />
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  No tickets match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-muted-foreground/30 pt-3">
          <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase tabular-nums">
            Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="border-2 border-ink bg-card px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-card disabled:cursor-not-allowed disabled:opacity-35"
            >
              ← Prev
            </button>
            <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase tabular-nums">
              Page {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="border-2 border-ink bg-card px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-card disabled:cursor-not-allowed disabled:opacity-35"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
