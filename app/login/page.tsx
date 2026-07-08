import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Punch in · Colourtex by LINKS",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="tag-panel w-full max-w-sm p-0">
        <div className="border-b-2 border-ink px-8 py-6 text-center">
          <span className="mx-auto mb-4 flex h-8 w-fit items-center bg-white px-2.5 outline outline-ink/15">
            <Image src="/links-logo.png" alt="LINKS" width={64} height={26} className="h-5 w-auto" priority />
          </span>
          <h1 className="text-xl font-extrabold tracking-[0.06em] uppercase">
            Colour<span className="text-indigo-dye">tex</span> <span className="text-thread">board</span>
          </h1>
          <p className="mt-1 text-[9px] font-bold tracking-[0.26em] text-muted-foreground uppercase">
            Authorised staff only
          </p>
        </div>
        <div className="px-8 py-7">
          <LoginForm from={from} />
        </div>
        <div className="border-t-2 border-dashed border-muted-foreground/30 px-8 py-3 text-center text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Access is device-bound and logged
        </div>
      </div>

      <Link
        href="/"
        className="mt-6 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-ink"
      >
        ← Back to the gate
      </Link>
    </div>
  )
}
