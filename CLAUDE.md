@AGENTS.md

<!-- second-brain spoke (auto-added 2026-07-14) -->
## Project context (second brain)

Air-freight dashboard for Colourtex Industries (Surat textile dyes) — 211 AWBs Mumbai→34 airports; part of the LINKS client-app family with VIPAR (sea) + INTAS (air).
Stack: Next.js 16 (canary)/React 19/TS, Tailwind 4, Neon serverless Postgres, Radix, cobe globe, xlsx.
Run: npm install → .env.local → npx tsx scripts/migrate.ts → npm run dev (:3002 to run alongside siblings).
Watch out: .env.local (AUTH_SECRET + Neon creds) — don't commit. Shares one Neon DB with VIPAR/INTAS via colourtex_*-prefixed tables. CLAUDE.md Next-version warning. Don't hand-edit lib/data.json — regenerate via scripts/build-dataset.ts.

Cross-project brain: `C:\Users\Manilal\second-brain` — full card `notes/projects/colourtex.md`, recent context `hot.md`. Read the brain for cross-project/domain knowledge; do NOT read it for general coding questions.
