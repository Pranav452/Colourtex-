import * as XLSX from "xlsx"

import { DESTINATIONS, canonDestination } from "./airports"
import type { FlightLeg, Shipment } from "./data"

// Parser for the LINKS Colourtex workbook. The file is MULTI-SHEET: one tab for
// the 2025 year plus monthly 2026 tabs (MARCH-26, APRIL-26, …). Every tab
// shares the same 10 columns:
//   SR NO | AWB NO | DATE | DESTINATION | INV. NO | CONSIGNEE | PKG. |
//   CHG_WTG | FLIGHT DETAILS. | CLEARANCE DATE
// Flight legs carry their own status suffix: "SQ:7973/26.02.2025-SIN-FLOWN".

export interface IngestReport {
  sheets: number
  totalRows: number
  parsedRows: number
  shipments: number
  skippedRows: number
  mergedDuplicates: number
  pkgs: number
  chargeableWt: number
  warnings: string[]
}

export interface IngestResult {
  shipments: Shipment[]
  report: IngestReport
}

const MAX_WARNINGS = 60

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v).replace(/\s+/g, " ").trim()
}

function cellNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v
  const n = Number(String(v ?? "").replace(/[, ]/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** DD.MM.YYYY (also -, /) or Excel serial → ISO. */
function parseDate(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const ms = Math.round((v - 25569) * 86_400_000)
    return new Date(ms).toISOString().slice(0, 10)
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`
  }
  const m = cellStr(v).match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  let y = Number(m[3])
  if (y < 100) y += 2000
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/** "SQ:7973/26.02.2025-SIN-FLOWN  EY-0057/09.07.2026-BRU-BKD" → legs with status. */
export function parseLegs(raw: string): FlightLeg[] {
  const legs: FlightLeg[] = []
  const re = /([A-Z0-9]{2})[\s:.-]{0,3}(\w{1,6})\s*\/\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\s*-?\s*([A-Z]{3})(?:\s*-\s*([A-Z]{3,8}))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw.toUpperCase())) !== null) {
    legs.push({
      carrier: m[1],
      flightNo: m[2],
      date: parseDate(m[3]),
      to: m[4],
      status: m[5] === "FLOWN" || m[5] === "DLVD" || m[5] === "BKD" ? (m[5] as FlightLeg["status"]) : null,
    })
  }
  return legs
}

function filledCount(s: Shipment): number {
  return Object.values(s).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "" && v !== 0,
  ).length
}

export function parseWorkbook(buffer: Buffer | ArrayBuffer): IngestResult {
  const wb = XLSX.read(buffer, {
    type: buffer instanceof ArrayBuffer ? "array" : "buffer",
    raw: true, // stop the CSV parser date-guessing DD.MM dates as US dates
    cellDates: false,
  })

  const warnings: string[] = []
  const warn = (msg: string) => {
    if (warnings.length < MAX_WARNINGS) warnings.push(msg)
  }

  const parsed: Shipment[] = []
  let totalRows = 0
  let skippedRows = 0
  let sheetsParsed = 0

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: "",
    })
    const headerIdx = rows.findIndex(
      (r) => cellStr(r[1]).toUpperCase().includes("AWB") && cellStr(r[3]).toUpperCase().includes("DEST"),
    )
    if (headerIdx < 0) {
      warn(`Sheet "${sheetName}": no AWB/DESTINATION header found — sheet skipped.`)
      continue
    }
    sheetsParsed++

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.every((c) => cellStr(c) === "")) continue
      totalRows++

      const awb = cellStr(row[1])
      if (!awb || awb.replace(/\D/g, "").length < 8) {
        skippedRows++
        if (row.some((c) => cellStr(c) !== "")) {
          warn(`Sheet "${sheetName}" row ${i + 1}: no AWB number — row skipped.`)
        }
        continue
      }

      const date = parseDate(row[2])
      if (!date) {
        skippedRows++
        warn(`AWB ${awb} (${sheetName}): unparseable date "${cellStr(row[2])}" — row skipped.`)
        continue
      }

      const destinationRaw = cellStr(row[3]).toUpperCase()
      const canon = canonDestination(destinationRaw)
      if (destinationRaw && !DESTINATIONS[canon]) {
        warn(`AWB ${awb}: destination "${destinationRaw}" has no airport mapping — counted, won't plot on the globe.`)
      }

      const legs = parseLegs(String(row[8] ?? ""))

      parsed.push({
        sr: Math.round(cellNum(row[0])) || parsed.length + 1,
        awb,
        date,
        destination: canon,
        invoice: cellStr(row[4]) || null,
        consignee: cellStr(row[5]).toUpperCase().replace(/\.$/, ""),
        pkgs: Math.round(cellNum(row[6])),
        chargeableWt: cellNum(row[7]),
        legs,
        clearanceDate: parseDate(row[9]),
        sheet: sheetName,
      })
    }
  }

  // Merge duplicate AWBs (same AWB re-listed across tabs) — keep the most complete row.
  const byKey = new Map<string, Shipment>()
  let mergedDuplicates = 0
  for (const s of parsed) {
    const key = `${s.awb}|${s.date}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, s)
      continue
    }
    mergedDuplicates++
    byKey.set(key, filledCount(s) >= filledCount(existing) ? s : existing)
    warn(`AWB ${s.awb}: duplicate row merged (kept the most complete entry).`)
  }

  const shipments = [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date) || a.sr - b.sr)

  const report: IngestReport = {
    sheets: sheetsParsed,
    totalRows,
    parsedRows: parsed.length,
    shipments: shipments.length,
    skippedRows,
    mergedDuplicates,
    pkgs: shipments.reduce((a, s) => a + s.pkgs, 0),
    chargeableWt: Math.round(shipments.reduce((a, s) => a + s.chargeableWt, 0)),
    warnings,
  }

  return { shipments, report }
}
