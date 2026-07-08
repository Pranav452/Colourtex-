"use client"

import { useActionState } from "react"

import { login, type LoginState } from "./actions"

export function LoginForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="flex flex-col gap-5">
      {from && <input type="hidden" name="from" value={from} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="user" className="text-[9px] font-extrabold tracking-[0.24em] text-muted-foreground uppercase">
          Login ID
        </label>
        <input
          id="user"
          name="user"
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
        className="tag-shadow-sm mt-1 border-2 border-ink bg-indigo-dye px-6 py-3 text-[11px] font-extrabold tracking-[0.24em] text-white uppercase transition-colors hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Punching in…" : "Punch in →"}
      </button>
    </form>
  )
}
