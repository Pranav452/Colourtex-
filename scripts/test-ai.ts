// Live smoke test for the AI warning review (hits OpenAI).
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), ".env.local")
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const [, key, rawValue] = m
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, "")
  }
}
loadEnvLocal()

async function main() {
  const { reviewWarnings } = await import("../lib/ai-review")
  const { SHIPMENTS } = await import("../lib/data")

  const warnings = [
    'AWB 618-35648631: destination "GAUTEMALA" has no airport mapping — counted, won\'t plot on the globe.',
    "AWB 607-53140824: duplicate row merged (kept the most complete entry).",
    'Sheet "JULY-26" row 7: no AWB number — row skipped (consignee "RADIANT COLOR NV").',
  ]

  console.time("ai-review")
  const review = await reviewWarnings(warnings, SHIPMENTS.slice(0, 50))
  console.timeEnd("ai-review")

  console.log("\nOVERVIEW:", review.overview)
  console.log("\nACTIONS:", JSON.stringify(review.actions, null, 1))
  console.log("\nEXPLANATIONS:")
  for (const e of review.explanations) {
    console.log("—", e.warning)
    console.log("  WHY:", e.cause || "(none)")
    console.log("  FIX:", e.fix || "(none)")
  }

  const ok = review.explanations.some((e) => e.cause && e.fix) && Boolean(review.overview)
  console.log(ok ? "\nPASS — AI pipeline working end-to-end." : "\nFAIL — no explanations/overview returned.")
  if (!ok) process.exit(1)
}

main().catch((err) => {
  console.error("FAILED:", err)
  process.exit(1)
})
