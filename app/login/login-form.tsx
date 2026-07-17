"use client"

import { useActionState, useState } from "react"

import { login, requestIpAccess, type IpRequestState, type LoginState } from "./actions"

export function LoginForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  const [reqState, reqAction, reqPending] = useActionState<IpRequestState, FormData>(requestIpAccess, {})
  const [userValue, setUserValue] = useState("")

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-5">
        {from && <input type="hidden" name="from" value={from} />}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="user" className="text-[9px] font-extrabold tracking-[0.24em] text-muted-foreground uppercase">
            Login ID
          </label>
          <input
            id="user"
            name="user"
            value={userValue}
            onChange={(e) => setUserValue(e.target.value)}
            autoComplete="username"
            required
            autoFocus
            className="h-10 border-2 border-ink/40 bg-card px-3 text-[14px] focus:border-indigo-dye focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[9px] font-extrabold tracking-[0.24em] text-muted-foreground uppercase">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-10 border-2 border-ink/40 bg-card px-3 text-[14px] focus:border-indigo-dye focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="border-2 border-destructive bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="tag-shadow-sm mt-1 border-2 border-ink bg-indigo-dye px-6 py-3 text-[11px] font-extrabold tracking-[0.24em] text-primary-foreground uppercase transition-colors hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Punching in…" : "Punch in →"}
        </button>
      </form>

      {state.ipBlocked && !reqState.success && (
        <form action={reqAction} className="flex flex-col gap-3 border-2 border-dashed border-thread/50 p-4">
          <input type="hidden" name="user" value={userValue} />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your network (<span className="font-mono font-bold text-ink">{state.blockedIp}</span>) is not
            yet approved. Send a request — an admin can allow it from the admin panel.
          </p>
          <input
            name="note"
            placeholder="Optional note (office name, location)…"
            className="h-9 border-2 border-ink/30 bg-card px-2.5 text-xs focus:border-indigo-dye focus:outline-none"
          />
          <button
            type="submit"
            disabled={reqPending}
            className="border-2 border-thread px-4 py-2 text-[10px] font-extrabold tracking-[0.18em] text-thread uppercase transition-colors hover:bg-thread hover:text-primary-foreground disabled:opacity-60"
          >
            {reqPending ? "Sending…" : "Request access for this network"}
          </button>
          {reqState.error && <p className="text-xs text-destructive">{reqState.error}</p>}
        </form>
      )}

      {reqState.success && (
        <p className="border-2 border-ink/20 bg-secondary px-4 py-3 text-xs leading-relaxed">
          Request sent. An admin will review it — try signing in again once your network is approved.
        </p>
      )}
    </div>
  )
}
