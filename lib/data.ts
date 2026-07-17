// Colourtex shipment model. The built-in dataset lives in lib/data.json,
// generated from the client's workbook by `npx tsx scripts/build-dataset.ts`
// (211 AWBs across the 2025 tab + monthly 2026 tabs at generation time).

import raw from "./data.json"

export const DATA_AS_OF = "2026-07-08"

export interface FlightLeg {
  carrier: string
  flightNo: string
  date: string | null
  to: string
  status: "FLOWN" | "BKD" | "DLVD" | null
}

export interface Shipment {
  sr: number
  awb: string
  date: string // booking date (sheet DATE column), ISO
  destination: string // canonical key into lib/airports DESTINATIONS
  invoice: string | null
  consignee: string
  pkgs: number
  chargeableWt: number
  legs: FlightLeg[]
  clearanceDate: string | null
  sheet: string // source tab, e.g. "Sheet1" (2025) or "JUNE-26"
  /** the FLIGHT DETAILS cell exactly as written in the sheet (all legs, raw) */
  flightDetailsRaw?: string | null
}

export type Status = "flown" | "booked" | "planned"

export const STATUS_LABEL: Record<Status, string> = {
  flown: "Flown",
  booked: "Booked",
  planned: "Planned",
}

/** Status from the legs: any BKD leg → booked; all legs FLOWN/DLVD → flown; no legs → planned. */
export function shipmentStatus(s: Shipment): Status {
  if (s.legs.length === 0) return "planned"
  if (s.legs.some((l) => l.status === "BKD")) return "booked"
  return "flown"
}

export const SHIPMENTS: Shipment[] = raw as Shipment[]
