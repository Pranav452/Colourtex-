import {
  DATA_AS_OF,
  SHIPMENTS,
  shipmentStatus,
  type Shipment,
  type Status,
} from "./data"
import { DESTINATIONS, ORIGIN, airlineName, titleCase } from "./airports"

export interface ShipmentWithStatus extends Shipment {
  status: Status
}

/** Dashboard period selection. null = everything. month is 1–12 and requires year. */
export interface Period {
  year: number | null
  month: number | null
}

export const ALL_TIME: Period = { year: null, month: null }

export const fmt = (n: number): string => Math.round(n).toLocaleString("en-IN")

export function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  })
}

export function fmtDateShort(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", timeZone: "UTC",
  })
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function periodLabel(p: Period): string {
  if (p.year === null) return "All time"
  if (p.month === null) return String(p.year)
  return `${MONTH_NAMES[p.month - 1]} ${p.year}`
}

export function inPeriod(iso: string, p: Period): boolean {
  if (p.year === null) return true
  const [y, m] = iso.split("-").map(Number)
  if (y !== p.year) return false
  return p.month === null || m === p.month
}

export interface NamedValue {
  name: string
  value: number
  hint?: string
}

export interface Lane {
  destination: string
  city: string
  country: string
  iata: string
  coords: [number, number]
  shipments: number
  chargeableWt: number
}

export interface GlobeArc {
  coords: [number, number]
  weight: number
}

export interface MonthPoint {
  year: number
  month: number
  label: string
  chargeableWt: number
  shipments: number
  selected: boolean
}

export interface DashboardStats {
  asOf: string
  period: Period
  withStatus: ShipmentWithStatus[]
  totals: {
    shipments: number
    pkgs: number
    chargeableWt: number
    destinations: number
    consignees: number
    countries: number
    flown: number
    booked: number
    invoices: number
    avgKgPerShipment: number
  }
  byDestination: NamedValue[]
  byConsignee: NamedValue[]
  byCarrier: NamedValue[]
  byCountry: NamedValue[]
  monthly: MonthPoint[] // full history, `selected` marks the active period
  lanes: Lane[]
  globeArcs: GlobeArc[]
  movements: ShipmentWithStatus[]
}

/** Distinct years and months present in the dataset — drives the filter UI. */
export function availablePeriods(shipments: Shipment[] = SHIPMENTS): { year: number; months: number[] }[] {
  const map = new Map<number, Set<number>>()
  for (const s of shipments) {
    const [y, m] = s.date.split("-").map(Number)
    if (!map.has(y)) map.set(y, new Set())
    map.get(y)!.add(m)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, months]) => ({ year, months: [...months].sort((a, b) => a - b) }))
}

export function computeStats(
  shipments: Shipment[] = SHIPMENTS,
  period: Period = ALL_TIME,
  asOf: string = DATA_AS_OF,
): DashboardStats {
  const allWithStatus: ShipmentWithStatus[] = shipments.map((s) => ({ ...s, status: shipmentStatus(s) }))
  const withStatus = allWithStatus.filter((s) => inPeriod(s.date, period))

  const totals = {
    shipments: withStatus.length,
    pkgs: withStatus.reduce((a, s) => a + s.pkgs, 0),
    chargeableWt: Math.round(withStatus.reduce((a, s) => a + s.chargeableWt, 0)),
    destinations: new Set(withStatus.map((s) => s.destination)).size,
    consignees: new Set(withStatus.map((s) => s.consignee)).size,
    countries: new Set(withStatus.map((s) => DESTINATIONS[s.destination]?.country ?? s.destination)).size,
    flown: withStatus.filter((s) => s.status === "flown").length,
    booked: withStatus.filter((s) => s.status === "booked").length,
    invoices: withStatus.filter((s) => s.invoice).length,
    avgKgPerShipment: 0,
  }
  totals.avgKgPerShipment = totals.shipments ? Math.round(totals.chargeableWt / totals.shipments) : 0

  const sumBy = (key: (s: ShipmentWithStatus) => string) => {
    const map = new Map<string, { wt: number; n: number }>()
    for (const s of withStatus) {
      const k = key(s)
      const e = map.get(k) ?? { wt: 0, n: 0 }
      e.wt += s.chargeableWt
      e.n += 1
      map.set(k, e)
    }
    return [...map.entries()].sort((a, b) => b[1].wt - a[1].wt)
  }

  const byDestination: NamedValue[] = sumBy((s) => s.destination).map(([dest, v]) => {
    const ap = DESTINATIONS[dest]
    return {
      name: ap ? `${ap.city} (${ap.iata})` : titleCase(dest),
      value: Math.round(v.wt),
      hint: `${v.n} AWB`,
    }
  })

  const byConsignee: NamedValue[] = sumBy((s) => s.consignee).map(([name, v]) => ({
    name: titleCase(name),
    value: Math.round(v.wt),
    hint: `${v.n} AWB`,
  }))

  const byCarrier: NamedValue[] = sumBy((s) => s.legs[0]?.carrier ?? "—").map(([code, v]) => ({
    name: airlineName(code),
    value: Math.round(v.wt),
    hint: `${v.n} AWB`,
  }))

  const byCountry: NamedValue[] = sumBy((s) => DESTINATIONS[s.destination]?.country ?? titleCase(s.destination)).map(
    ([name, v]) => ({ name, value: Math.round(v.wt) }),
  )

  // Full month-by-month history — the chart shows everything, the active period is marked.
  const monthMap = new Map<string, MonthPoint>()
  for (const s of allWithStatus) {
    const [y, m] = s.date.split("-").map(Number)
    const key = `${y}-${String(m).padStart(2, "0")}`
    const e = monthMap.get(key) ?? {
      year: y,
      month: m,
      label: `${MONTH_NAMES[m - 1].slice(0, 3)} ${String(y).slice(2)}`,
      chargeableWt: 0,
      shipments: 0,
      selected: inPeriod(s.date, period),
    }
    e.chargeableWt += s.chargeableWt
    e.shipments += 1
    monthMap.set(key, e)
  }
  const monthly = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ ...v, chargeableWt: Math.round(v.chargeableWt) }))

  const laneMap = new Map<string, Lane>()
  for (const s of withStatus) {
    const ap = DESTINATIONS[s.destination]
    if (!ap) continue
    const lane = laneMap.get(s.destination) ?? {
      destination: s.destination,
      city: ap.city,
      country: ap.country,
      iata: ap.iata,
      coords: ap.coords,
      shipments: 0,
      chargeableWt: 0,
    }
    lane.shipments += 1
    lane.chargeableWt += s.chargeableWt
    laneMap.set(s.destination, lane)
  }
  const lanes = [...laneMap.values()]
    .map((l) => ({ ...l, chargeableWt: Math.round(l.chargeableWt) }))
    .sort((a, b) => b.chargeableWt - a.chargeableWt)

  const globeArcs: GlobeArc[] = lanes.map((l) => ({ coords: l.coords, weight: l.chargeableWt }))

  const movements = [...withStatus].sort((a, b) => b.date.localeCompare(a.date) || b.sr - a.sr)

  return {
    asOf,
    period,
    withStatus: movements,
    totals,
    byDestination,
    byConsignee,
    byCarrier,
    byCountry,
    monthly,
    lanes,
    globeArcs,
    movements,
  }
}

export { ORIGIN }
