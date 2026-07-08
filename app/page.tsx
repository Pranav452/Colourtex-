import Image from "next/image"
import Link from "next/link"

import { MillGlobe } from "@/components/mill-globe"
import { SiteHeader } from "@/components/site-header"

const TICKETS = [
  { code: "AWB", title: "Waybill tracking", blurb: "Every consignment tagged from booking to touchdown." },
  { code: "LEG", title: "Flight routings", blurb: "Multi-leg journeys with FLOWN / BKD status per leg." },
  { code: "LOT", title: "Monthly lots", blurb: "Filter the whole board by year and month, like the workbook." },
  { code: "CLR", title: "Clearances", blurb: "Customs clearance dates stitched to every shipment." },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col items-start gap-7">
              <span className="tag-shadow-sm inline-block border-2 border-ink bg-card px-4 py-1.5 text-[10px] font-extrabold tracking-[0.28em] uppercase">
                Colourtex Industries · private board
              </span>

              <h1 className="text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-6xl">
                Dye works,
                <br />
                <span className="text-indigo-dye">shipped</span> by <span className="text-thread">air</span>.
              </h1>

              <p className="max-w-[52ch] text-[15px] leading-[1.7] text-muted-foreground">
                The garment-tag record of every Colourtex consignment out of Mumbai — waybills,
                flight legs, clearances and monthly lots across five continents. Packed, flown,
                cleared; stitched together by LINKS. Figures visible to authorised staff only.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="tag-shadow-sm inline-block border-2 border-ink bg-indigo-dye px-7 py-3 text-[11px] font-extrabold tracking-[0.22em] text-white uppercase transition-colors hover:bg-ink"
                >
                  Punch in →
                </Link>
                <Link
                  href="mailto:mpcargolille@gmail.com"
                  className="tag-shadow-sm inline-block border-2 border-ink bg-card px-7 py-3 text-[11px] font-extrabold tracking-[0.22em] uppercase transition-colors hover:bg-ink hover:text-card"
                >
                  Contact LINKS
                </Link>
              </div>

              <p className="text-[10px] tracking-[0.18em] text-muted-foreground/80 uppercase">
                Access is restricted, device-bound and logged.
              </p>
            </div>

            <div className="relative -my-2">
              <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_52%,var(--canvas)_93%)]" />
              <MillGlobe className="max-w-[480px]" />
            </div>
          </div>

          {/* capability tickets */}
          <div className="grid gap-5 pb-14 sm:grid-cols-2 lg:grid-cols-4">
            {TICKETS.map((t) => (
              <div key={t.code} className="tag-panel p-4">
                <div className="flex items-center justify-between border-b-2 border-dashed border-muted-foreground/30 pb-2">
                  <span className="text-[10px] font-extrabold tracking-[0.24em] text-thread uppercase">{t.code}</span>
                  <span className="h-2 w-2 bg-indigo-dye" />
                </div>
                <div className="mt-3 text-[13px] font-extrabold tracking-[0.06em] uppercase">{t.title}</div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-ink bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-6 items-center bg-white px-2 outline outline-ink/15">
              <Image src="/links-logo.png" alt="LINKS" width={44} height={18} className="h-3.5 w-auto" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              LINKS · Freight forwarding &amp; export operations
            </span>
          </div>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
            Woven for Colourtex Industries
          </span>
        </div>
      </footer>
    </div>
  )
}
