// Airport registry for the Colourtex dashboard. Coords are [lat, lon].
// ALIASES maps the sheet's messy destination strings onto canonical keys.

export interface Airport {
  iata: string
  city: string
  country: string
  coords: [number, number]
}

export const ORIGIN: Airport = { iata: "BOM", city: "Mumbai", country: "India", coords: [19.09, 72.87] }

export const DESTINATIONS: Record<string, Airport> = {
  "HO CHI MINH CITY": { iata: "SGN", city: "Ho Chi Minh City", country: "Vietnam", coords: [10.82, 106.66] },
  "MILAN MALPENSA": { iata: "MXP", city: "Milan", country: "Italy", coords: [45.63, 8.72] },
  "MEXICO CITY": { iata: "MEX", city: "Mexico City", country: "Mexico", coords: [19.44, -99.07] },
  TAIPEI: { iata: "TPE", city: "Taipei", country: "Taiwan", coords: [25.08, 121.23] },
  INCHEON: { iata: "ICN", city: "Seoul", country: "South Korea", coords: [37.46, 126.44] },
  COLOMBO: { iata: "CMB", city: "Colombo", country: "Sri Lanka", coords: [7.18, 79.88] },
  JAKARTA: { iata: "CGK", city: "Jakarta", country: "Indonesia", coords: [-6.13, 106.66] },
  MANCHESTER: { iata: "MAN", city: "Manchester", country: "United Kingdom", coords: [53.35, -2.28] },
  BRUSSELS: { iata: "BRU", city: "Brussels", country: "Belgium", coords: [50.9, 4.48] },
  CHARLOTTE: { iata: "CLT", city: "Charlotte", country: "United States", coords: [35.21, -80.94] },
  AMSTERDAM: { iata: "AMS", city: "Amsterdam", country: "Netherlands", coords: [52.31, 4.76] },
  LIMA: { iata: "LIM", city: "Lima", country: "Peru", coords: [-12.02, -77.11] },
  BOGOTA: { iata: "BOG", city: "Bogotá", country: "Colombia", coords: [4.7, -74.14] },
  DETROIT: { iata: "DTW", city: "Detroit", country: "United States", coords: [42.21, -83.35] },
  FRANKFURT: { iata: "FRA", city: "Frankfurt", country: "Germany", coords: [50.04, 8.56] },
  BARCELONA: { iata: "BCN", city: "Barcelona", country: "Spain", coords: [41.3, 2.08] },
  DUSSELDORF: { iata: "DUS", city: "Düsseldorf", country: "Germany", coords: [51.29, 6.77] },
  ISTANBUL: { iata: "IST", city: "Istanbul", country: "Türkiye", coords: [41.26, 28.74] },
  NARITA: { iata: "NRT", city: "Tokyo", country: "Japan", coords: [35.77, 140.39] },
  SHANGHAI: { iata: "PVG", city: "Shanghai", country: "China", coords: [31.14, 121.81] },
  BANGKOK: { iata: "BKK", city: "Bangkok", country: "Thailand", coords: [13.69, 100.75] },
  DHAKA: { iata: "DAC", city: "Dhaka", country: "Bangladesh", coords: [23.84, 90.4] },
  SINGAPORE: { iata: "SIN", city: "Singapore", country: "Singapore", coords: [1.36, 103.99] },
  OSAKA: { iata: "KIX", city: "Osaka", country: "Japan", coords: [34.43, 135.24] },
  MINSK: { iata: "MSQ", city: "Minsk", country: "Belarus", coords: [53.88, 28.03] },
  "SAO PAULO": { iata: "GRU", city: "São Paulo", country: "Brazil", coords: [-23.43, -46.47] },
  "CAPE TOWN": { iata: "CPT", city: "Cape Town", country: "South Africa", coords: [-33.97, 18.6] },
  QUITO: { iata: "UIO", city: "Quito", country: "Ecuador", coords: [-0.13, -78.36] },
  MANAGUA: { iata: "MGA", city: "Managua", country: "Nicaragua", coords: [12.14, -86.17] },
  TIANJIN: { iata: "TSN", city: "Tianjin", country: "China", coords: [39.12, 117.35] },
  WARSAW: { iata: "WAW", city: "Warsaw", country: "Poland", coords: [52.17, 20.97] },
  BUCHAREST: { iata: "OTP", city: "Bucharest", country: "Romania", coords: [44.57, 26.1] },
  MONTREAL: { iata: "YUL", city: "Montreal", country: "Canada", coords: [45.47, -73.74] },
  GUATEMALA: { iata: "GUA", city: "Guatemala City", country: "Guatemala", coords: [14.58, -90.53] },
}

// Sheet spelling → canonical DESTINATIONS key
export const DEST_ALIASES: Record<string, string> = {
  "JAKARTA SOEKARNO": "JAKARTA",
  "SEOUL INCHEON": "INCHEON",
  "DETROIT AIRPORT": "DETROIT",
  "ISTANBUL/ TURKEY": "ISTANBUL",
  "ISTANBUL TURKEY": "ISTANBUL",
  "NARITA AIRPORT": "NARITA",
  "PU DONG": "SHANGHAI",
  PUDONG: "SHANGHAI",
  MILANO: "MILAN MALPENSA",
  MILAN: "MILAN MALPENSA",
  MEXICO: "MEXICO CITY",
  MANCHESTAR: "MANCHESTER",
  KANSAI: "OSAKA",
  "KANSAI INTL": "OSAKA",
  GUARULHOS: "SAO PAULO",
  CAPETOWN: "CAPE TOWN",
  GAUTEMALA: "GUATEMALA",
  OTOPENI: "BUCHAREST",
}

export function canonDestination(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/\s+/g, " ")
  return DEST_ALIASES[key] ?? key
}

export function destination(raw: string): Airport | undefined {
  return DESTINATIONS[canonDestination(raw)]
}

export const AIRLINES: Record<string, string> = {
  SQ: "Singapore Airlines",
  EY: "Etihad",
  EK: "Emirates",
  LH: "Lufthansa",
  AF: "Air France",
  KL: "KLM",
  CX: "Cathay Pacific",
  AC: "Air Canada",
  "6E": "IndiGo",
  VN: "Vietnam Airlines",
  TK: "Turkish Airlines",
  QR: "Qatar Airways",
  BA: "British Airways",
  TG: "Thai Airways",
  MH: "Malaysia Airlines",
  KE: "Korean Air",
  OZ: "Asiana",
  UL: "SriLankan",
  AI: "Air India",
  CI: "China Airlines",
  BR: "EVA Air",
  SV: "Saudia",
  ET: "Ethiopian",
  GA: "Garuda",
  CV: "Cargolux",
}

export function airlineName(code: string): string {
  return AIRLINES[code] ?? code
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
