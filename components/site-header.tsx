import Image from "next/image"
import Link from "next/link"

import { AnimatedThemeToggle } from "@/components/theme-toggle"
import { logout } from "@/app/login/actions"
import { getSession } from "@/lib/auth"
import { fmtDate } from "@/lib/stats"
import { loadDataset } from "@/lib/store"

export async function SiteHeader() {
  const session = await getSession()
  const dataset = session ? await loadDataset() : null

  return (
    <header className="border-b-2 border-ink bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-4">
          <span className="tag-shadow-sm flex flex-col border-2 border-ink bg-card px-3 py-1.5 leading-none">
            <span className="text-[17px] font-extrabold tracking-[0.06em] uppercase">
              Colour<span className="text-indigo-dye">tex</span>
            </span>
            <span className="mt-0.5 text-[8px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
              Dye works · Surat
            </span>
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[11px] font-extrabold tracking-[0.24em] uppercase">Air export board</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
              stitched by
              <span className="flex h-4 items-center bg-white px-1 outline outline-ink/15">
                <Image src="/links-logo.png" alt="LINKS" width={34} height={14} className="h-2.5 w-auto" priority />
              </span>
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {session && (
            <nav className="flex items-center gap-5 text-[11px] font-extrabold tracking-[0.18em] uppercase">
              <Link href="/dashboard" className="text-ink transition-colors hover:text-indigo-dye">
                Board
              </Link>
              {(session.role === "uploader" || session.role === "admin") && (
                <Link href="/admin/upload" className="text-muted-foreground transition-colors hover:text-indigo-dye">
                  Upload
                </Link>
              )}
              {session.role === "admin" && (
                <Link href="/admin" className="text-muted-foreground transition-colors hover:text-indigo-dye">
                  Admin
                </Link>
              )}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <AnimatedThemeToggle className="tag-shadow-sm border-2 border-ink bg-card text-ink hover:text-indigo-dye" />
            {session && dataset && (
              <span className="hidden -rotate-2 border-2 border-thread px-2 py-0.5 text-[9px] font-extrabold tracking-[0.16em] text-thread uppercase select-none md:inline-block">
                Lot of {fmtDate(dataset.asOf)}
              </span>
            )}
            {session ? (
              <form action={logout}>
                <button
                  type="submit"
                  className="tag-shadow-sm border-2 border-ink bg-card px-3.5 py-1.5 text-[10px] font-extrabold tracking-[0.16em] uppercase transition-colors hover:bg-ink hover:text-card"
                >
                  Punch out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="tag-shadow-sm inline-block border-2 border-ink bg-indigo-dye px-4 py-2 text-[10px] font-extrabold tracking-[0.16em] text-primary-foreground uppercase transition-colors hover:bg-ink"
              >
                Punch in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
