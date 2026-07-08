// Regenerate lib/data.json from the client's workbook.
// Usage: npx tsx scripts/build-dataset.ts [path-to-xlsx]
// Default source: C:/Users/Manilal/Downloads/Colourtex.xlsx

import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { parseWorkbook } from "../lib/ingest"

const src = process.argv[2] ?? "C:/Users/Manilal/Downloads/Colourtex.xlsx"
const out = path.join(process.cwd(), "lib", "data.json")

const { shipments, report } = parseWorkbook(readFileSync(src))

writeFileSync(out, JSON.stringify(shipments, null, 1))

console.log(`Parsed ${report.sheets} sheets · ${report.shipments} shipments · ${report.pkgs} pkgs · ${report.chargeableWt} kg`)
console.log(`Skipped ${report.skippedRows} rows · merged ${report.mergedDuplicates} duplicates`)
if (report.warnings.length) {
  console.log(`\n${report.warnings.length} warnings:`)
  for (const w of report.warnings) console.log("  ·", w)
}
console.log(`\nWrote ${out}`)
