import type { Metadata } from "next"

import { MillGlobe } from "@/components/mill-globe"
import { PeriodFilter } from "@/components/period-filter"
import { ShipmentsTable } from "@/components/shipments-table"
import { SiteHeader } from "@/components/site-header"
import { MillBars, MillColumns, PanelHead, TagPanel, TagStamp } from "@/components/tag"
import { airlineName } from "@/lib/airports"
import { availablePeriods, computeStats, fmt, fmtDate, fmtDateShort, periodLabel, type Period } from "@/lib/stats"
import { loadDataset } from "@/lib/store"

export const metadata: Metadata = {
  title: "Board · Colourtex by LINKS",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const sp = await searchParams
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : null
  const month = year !== null && /^\d{1,2}$/.test(sp.month ?? "") ? Number(sp.month) : null
  const period: Period = { year, month: month && month >= 1 && month <= 12 ? month : null }

  const dataset = await loadDataset()
  const stats = computeStats(dataset.shipments, period, dataset.asOf)
  const periods = availablePeriods(dataset.shipments)
  const t = stats.totals

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
        {/* Title + period filter */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-[0.26em] text-muted-foreground uppercase">
              LINKS / Client · Colourtex Industries
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight uppercase sm:text-3xl">
              Air export board <span className="text-indigo-dye">· {periodLabel(stats.period)}</span>
            </h1>
          </div>
          <PeriodFilter periods={periods} year={period.year} month={period.month} />
        </div>

        {/* Row 1: lot totals · monthly lots · latest tickets — equal height, scroll inside */}
        <div className="grid gap-5 lg:grid-cols-3">
          <TagPanel className="flex h-[440px] flex-col">
            <PanelHead left="Lot totals" right={periodLabel(stats.period)} />
            <div className="flex min-h-0 flex-1 flex-col justify-between">
              <div className="text-4xl font-extrabold tracking-tight tabular-nums">
                {fmt(t.chargeableWt)} <span className="text-sm font-bold text-muted-foreground">kg chargeable</span>
              </div>
              <div className="stitch pt-4">
                <MillBars
                  items={[
                    { label: "Shipments", value: t.shipments },
                    { label: "Packages", value: t.pkgs },
                    { label: "Consignees", value: t.consignees },
                    { label: "Destinations", value: t.destinations },
                  ]}
                />
              </div>
              <div className="stitch flex items-center justify-between pt-3.5 text-[11px] font-bold tracking-[0.14em] uppercase">
                <span>
                  <span className="text-ink">{t.flown}</span> flown · <span className="text-thread">{t.booked}</span> booked
                </span>
                <span className="text-muted-foreground">{fmt(t.avgKgPerShipment)} kg avg / AWB</span>
              </div>
            </div>
          </TagPanel>

          <TagPanel className="flex h-[440px] flex-col">
            <PanelHead left="Monthly lots" right="kg chargeable · dyed = selected" />
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <MillColumns
                height={230}
                items={stats.monthly.map((m) => ({
                  label: m.label,
                  value: m.chargeableWt,
                  selected: m.selected,
                  hint: `${m.label} · ${fmt(m.chargeableWt)} kg · ${m.shipments} AWB`,
                }))}
              />
            </div>
          </TagPanel>

          <TagPanel className="flex h-[440px] flex-col">
            <PanelHead left="Latest tickets" right="newest first" />
            <div className="-mr-2 flex min-h-0 flex-1 flex-col overflow-y-auto pr-2">
              {stats.movements.slice(0, 20).map((s) => (
                <div key={s.awb + s.date} className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11.5px] font-bold">{s.awb}</div>
                    <div className="truncate text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                      {fmtDateShort(s.date)} · {s.destination} · {fmt(s.chargeableWt)} kg
                    </div>
                  </div>
                  <TagStamp status={s.status} />
                </div>
              ))}
            </div>
          </TagPanel>
        </div>

        {/* Row 2: globe + lanes */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <TagPanel className="relative overflow-hidden">
            <PanelHead left="Thread map" right={`Mumbai → ${t.destinations} airports`} />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--card)_96%)]" />
            <MillGlobe lanes={stats.globeArcs} className="max-w-[400px]" />
          </TagPanel>

          <TagPanel>
            <PanelHead left="Lanes by weight" right={`${t.countries} countries`} />
            <div className="grid max-h-[420px] grid-cols-1 gap-x-8 overflow-y-auto pr-1 sm:grid-cols-2">
              {stats.lanes.map((lane) => (
                <div key={lane.destination} className="flex items-center gap-3 border-b border-border py-2">
                  <span className="w-9 shrink-0 font-mono text-[11px] font-extrabold text-indigo-dye">{lane.iata}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold">{lane.city}</div>
                    <div className="text-[10px] text-muted-foreground">{lane.country}</div>
                  </div>
                  <div className="text-right text-[11px] tabular-nums">
                    <div className="font-bold">{fmt(lane.chargeableWt)} kg</div>
                    <div className="text-muted-foreground">{lane.shipments} AWB</div>
                  </div>
                </div>
              ))}
              {stats.lanes.length === 0 && (
                <p className="py-6 text-xs tracking-[0.14em] text-muted-foreground uppercase">No shipments in this lot.</p>
              )}
            </div>
          </TagPanel>
        </div>

        {/* Row 3: consignees · carriers · countries */}
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <TagPanel>
            <PanelHead left="Top consignees" right="kg chargeable" />
            <MillBars items={stats.byConsignee.slice(0, 8).map((c) => ({ label: c.name, value: c.value }))} />
          </TagPanel>
          <TagPanel>
            <PanelHead left="Carriers" right="first uplift leg" />
            <MillBars items={stats.byCarrier.slice(0, 8).map((c) => ({ label: c.name, value: c.value }))} />
            {stats.byCarrier[0] && (
              <p className="stitch mt-4 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                {stats.byCarrier[0].name} lifts{" "}
                {Math.round((stats.byCarrier[0].value / Math.max(t.chargeableWt, 1)) * 100)}% of this lot.
              </p>
            )}
          </TagPanel>
          <TagPanel>
            <PanelHead left="Countries" right="kg chargeable" />
            <MillBars items={stats.byCountry.slice(0, 8).map((c) => ({ label: c.name, value: c.value }))} />
          </TagPanel>
        </div>

        {/* The manifest */}
        <div className="mt-5" id="manifest">
          <ShipmentsTable shipments={stats.withStatus} periodLabel={periodLabel(stats.period)} />
        </div>

        <p className="mt-8 border-t-2 border-ink pt-5 text-center text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
          Colourtex air export board · stitched by LINKS · data as of {fmtDate(stats.asOf)}
        </p>
      </main>
    </div>
  )
}
