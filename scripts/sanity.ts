// Dataset sanity vs raw workbook sums.
// Usage: npx tsx scripts/sanity.ts
import { SHIPMENTS, shipmentStatus } from "../lib/data"
import { DESTINATIONS } from "../lib/airports"
import { ALL_TIME, availablePeriods, computeStats } from "../lib/stats"

const stats = computeStats(SHIPMENTS, ALL_TIME)
const t = stats.totals

console.log("shipments:", t.shipments, "(expect 211)")
console.log("pkgs:", t.pkgs, "(expect 308)")
console.log("chargeable:", t.chargeableWt, "(expect 104453)")
console.log("destinations (canonical):", t.destinations, "| consignees:", t.consignees, "| countries:", t.countries)
console.log("flown:", t.flown, "| booked:", t.booked)
console.log("periods:", availablePeriods().map((p) => `${p.year}[${p.months.join(",")}]`).join(" "))

const march = computeStats(SHIPMENTS, { year: 2026, month: 3 })
console.log("Mar-26 lot:", march.totals.shipments, "AWB ·", march.totals.chargeableWt, "kg")

let fail = false
const assert = (c: boolean, m: string) => { console.log(c ? `PASS  ${m}` : `FAIL  ${m}`); if (!c) fail = true }
assert(t.shipments === 211, "211 shipments")
assert(t.pkgs === 308, "308 pkgs")
assert(t.chargeableWt === 104453, "104,453 kg chargeable")
assert(SHIPMENTS.every((s) => DESTINATIONS[s.destination]), "every destination canonical/mapped")
assert(SHIPMENTS.every((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.date)), "all dates ISO")
assert(availablePeriods().length === 2, "two years present (2025, 2026)")
const y2026 = computeStats(SHIPMENTS, { year: 2026, month: null }).totals.shipments
const y2025 = computeStats(SHIPMENTS, { year: 2025, month: null }).totals.shipments
assert(y2025 + y2026 === 211, `year split sums (2025=${y2025} + 2026=${y2026})`)
assert(march.totals.shipments > 0 && march.totals.shipments < 211, "month filter narrows")
assert(t.booked >= 1, "at least one BKD shipment detected")
if (fail) process.exit(1)
console.log("\nAll sanity checks passed.")
