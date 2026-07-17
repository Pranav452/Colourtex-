"use client"

import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bot, CheckCircle2, FileSpreadsheet, Loader2, TriangleAlert, UploadCloud } from "lucide-react"

import type { Shipment } from "@/lib/data"
import { cn } from "@/lib/utils"
import { analyzeUpload, commitUpload, type AnalyzeState, type CommitState } from "./actions"

const GRID_PAGE = 20

export function UploadForm({ today }: { today: string }) {
  const [state, analyzeAction, analyzing] = useActionState<AnalyzeState, FormData>(analyzeUpload, {})
  const [commitState, commitAction, committing] = useActionState<CommitState, FormData>(commitUpload, {})
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // editable copy of the parsed rows
  const [rows, setRows] = useState<Shipment[]>([])
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (state.shipments) {
      setRows(state.shipments)
      setPage(0)
    }
  }, [state.shipments])

  const warningAwbs = useMemo(() => {
    const set = new Set<string>()
    for (const e of state.ai?.explanations ?? []) if (e.awb) set.add(e.awb)
    for (const w of state.report?.warnings ?? []) {
      const m = w.match(/AWB\s+([0-9-]{8,})/)
      if (m) set.add(m[1])
    }
    return set
  }, [state.ai, state.report])

  const visible = useMemo(
    () => (flaggedOnly ? rows.filter((r) => warningAwbs.has(r.awb)) : rows),
    [rows, flaggedOnly, warningAwbs],
  )
  const pageCount = Math.max(1, Math.ceil(visible.length / GRID_PAGE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = visible.slice(safePage * GRID_PAGE, (safePage + 1) * GRID_PAGE)

  const edit = (awb: string, date: string, patch: Partial<Shipment>) =>
    setRows((cur) => cur.map((r) => (r.awb === awb && r.date === date ? { ...r, ...patch } : r)))

  const cellCls =
    "w-full border border-transparent bg-transparent px-1.5 py-1 text-[11.5px] focus:border-indigo-dye focus:bg-card focus:outline-none"

  if (commitState.success) {
    return (
      <div className="tag-panel flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-indigo-dye" />
          <span className="text-sm font-extrabold tracking-[0.08em] uppercase">
            Committed — {commitState.shipments} AWBs · version #{commitState.versionId}
          </span>
        </div>
        {commitState.warnings && commitState.warnings.length > 0 && (
          <ul className="border-2 border-dashed border-thread/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            {commitState.warnings.map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard"
          className="tag-shadow-sm inline-flex w-fit items-center gap-1.5 border-2 border-ink bg-indigo-dye px-5 py-2.5 text-[10px] font-extrabold tracking-[0.2em] text-primary-foreground uppercase transition-colors hover:bg-ink"
        >
          Open the board <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stage 1 — pick file + analyze */}
      {!state.shipments && (
        <form action={analyzeAction} className="flex flex-col gap-4">
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file && inputRef.current) {
                const dt = new DataTransfer()
                dt.items.add(file)
                inputRef.current.files = dt.files
                setFileName(file.name)
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed bg-card p-10 text-center transition-all duration-300",
              dragging ? "border-indigo-dye bg-indigo-dye/[0.04]" : "border-ink/[0.25] hover:border-ink/[0.45]",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            {fileName ? (
              <>
                <FileSpreadsheet className="h-8 w-8 text-indigo-dye" />
                <span className="text-sm font-bold">{fileName}</span>
                <span className="text-xs text-muted-foreground">Click to choose a different file</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                <span className="text-sm font-extrabold tracking-[0.08em] uppercase">Drop the workbook here</span>
                <span className="text-xs text-muted-foreground">
                  or click to browse · .xlsx export of the Colourtex sheet (all monthly tabs)
                </span>
              </>
            )}
          </label>

          <button
            type="submit"
            disabled={analyzing}
            className="tag-shadow-sm h-11 border-2 border-ink bg-indigo-dye px-6 text-[11px] font-extrabold tracking-[0.22em] text-primary-foreground uppercase transition-colors hover:bg-ink disabled:opacity-60"
          >
            {analyzing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Parsing &amp; running AI review…
              </span>
            ) : (
              "Analyse before upload →"
            )}
          </button>

          {state.error && (
            <p className="border-2 border-destructive bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </form>
      )}

      {/* Stage 2 — review, edit, commit */}
      {state.shipments && state.report && (
        <>
          {/* Totals strip */}
          <div className="tag-panel flex flex-wrap items-center gap-x-8 gap-y-2 p-4 text-[11px] font-bold tracking-[0.1em] uppercase">
            <span>{state.fileName}</span>
            <span>{state.report.sheets} tabs</span>
            <span>{state.report.shipments} AWBs</span>
            <span>{state.report.pkgs.toLocaleString("en-IN")} pkgs</span>
            <span>{state.report.chargeableWt.toLocaleString("en-IN")} kg</span>
            <span className={cn(state.report.warnings.length && "text-thread")}>
              {state.report.warnings.length} warnings
            </span>
            <span className="text-muted-foreground">{state.report.mergedDuplicates} duplicates merged</span>
          </div>

          {/* AI review */}
          {(state.ai?.overview || (state.ai?.explanations.length ?? 0) > 0) && (
            <div className="tag-panel flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2 border-b-2 border-dashed border-muted-foreground/30 pb-2.5">
                <Bot className="h-4 w-4 text-indigo-dye" />
                <span className="text-[11px] font-extrabold tracking-[0.22em] uppercase">AI data-quality review</span>
              </div>
              {state.ai?.overview && <p className="text-[13px] leading-relaxed">{state.ai.overview}</p>}
              {(state.ai?.actions.length ?? 0) > 0 && (
                <ol className="flex flex-col gap-1 text-[12px] leading-relaxed">
                  {state.ai!.actions.map((a, i) => (
                    <li key={i}>
                      <span className="font-extrabold text-indigo-dye">{i + 1}.</span> {a}
                    </li>
                  ))}
                </ol>
              )}
              {(state.ai?.explanations.length ?? 0) > 0 && (
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                  {state.ai!.explanations.map((e, i) => (
                    <div key={i} className="border-l-4 border-thread bg-thread/[0.05] px-3 py-2">
                      <div className="flex items-start gap-1.5 text-[11.5px] font-bold">
                        <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-thread" />
                        {e.warning}
                      </div>
                      {e.cause && (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                          <span className="font-extrabold text-foreground/80 uppercase">Why:</span> {e.cause}
                        </p>
                      )}
                      {e.fix && (
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                          <span className="font-extrabold text-indigo-dye uppercase">Fix:</span> {e.fix}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Editable grid */}
          <div className="tag-panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-muted-foreground/30 pb-3">
              <span className="text-[11px] font-extrabold tracking-[0.22em] uppercase">
                Check &amp; edit before commit
                <span className="ml-2 text-muted-foreground normal-case">
                  {visible.length} rows · flagged rows marked
                </span>
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold tracking-[0.12em] uppercase">
                <input
                  type="checkbox"
                  checked={flaggedOnly}
                  onChange={(e) => {
                    setFlaggedOnly(e.target.checked)
                    setPage(0)
                  }}
                />
                Flagged only
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-left text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">AWB</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">Date (ISO)</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">Destination</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">Invoice</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">Consignee</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 text-right font-extrabold">Pkg</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 text-right font-extrabold">Chg. kg</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">Flight details</th>
                    <th className="border-b-2 border-ink px-1.5 py-2 font-extrabold">Cleared (ISO)</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => {
                    const flagged = warningAwbs.has(r.awb)
                    return (
                      <tr
                        key={r.awb + r.date}
                        className={cn("border-b border-border align-top", flagged && "bg-thread/[0.06]")}
                      >
                        <td className="w-32">
                          <div className="flex items-center gap-1">
                            {flagged && <TriangleAlert className="h-3 w-3 shrink-0 text-thread" />}
                            <input
                              className={cn(cellCls, "font-mono font-bold")}
                              value={r.awb}
                              onChange={(e) => edit(r.awb, r.date, { awb: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="w-26">
                          <input className={cellCls} value={r.date} onChange={(e) => edit(r.awb, r.date, { date: e.target.value })} />
                        </td>
                        <td className="w-36">
                          <input
                            className={cellCls}
                            value={r.destination}
                            onChange={(e) => edit(r.awb, r.date, { destination: e.target.value })}
                          />
                        </td>
                        <td className="w-28">
                          <input
                            className={cellCls}
                            value={r.invoice ?? ""}
                            onChange={(e) => edit(r.awb, r.date, { invoice: e.target.value || null })}
                          />
                        </td>
                        <td className="min-w-40">
                          <input
                            className={cellCls}
                            value={r.consignee}
                            onChange={(e) => edit(r.awb, r.date, { consignee: e.target.value })}
                          />
                        </td>
                        <td className="w-14">
                          <input
                            className={cn(cellCls, "text-right tabular-nums")}
                            value={String(r.pkgs)}
                            onChange={(e) => edit(r.awb, r.date, { pkgs: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="w-20">
                          <input
                            className={cn(cellCls, "text-right tabular-nums")}
                            value={String(r.chargeableWt)}
                            onChange={(e) => edit(r.awb, r.date, { chargeableWt: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="min-w-64">
                          <textarea
                            rows={1}
                            className={cn(cellCls, "resize-y font-mono text-[10.5px]")}
                            value={r.flightDetailsRaw ?? ""}
                            onChange={(e) => edit(r.awb, r.date, { flightDetailsRaw: e.target.value })}
                          />
                        </td>
                        <td className="w-26">
                          <input
                            className={cellCls}
                            value={r.clearanceDate ?? ""}
                            onChange={(e) => edit(r.awb, r.date, { clearanceDate: e.target.value || null })}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-muted-foreground/30 pt-3">
                <span className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
                  Rows {safePage * GRID_PAGE + 1}–{Math.min((safePage + 1) * GRID_PAGE, visible.length)} of {visible.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, safePage - 1))}
                    disabled={safePage === 0}
                    className="border-2 border-ink bg-card px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] uppercase hover:bg-ink hover:text-card disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    ← Prev
                  </button>
                  <span className="text-[10px] font-extrabold uppercase tabular-nums">
                    {safePage + 1} / {pageCount}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                    disabled={safePage >= pageCount - 1}
                    className="border-2 border-ink bg-card px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] uppercase hover:bg-ink hover:text-card disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Commit */}
          <form action={commitAction} className="tag-panel flex flex-wrap items-end gap-4 p-5">
            <input type="hidden" name="rows" value={JSON.stringify(rows)} />
            <input type="hidden" name="source" value={state.fileName ?? "edited upload"} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="asOf" className="text-[9px] font-extrabold tracking-[0.24em] text-muted-foreground uppercase">
                Data as of
              </label>
              <input
                id="asOf"
                name="asOf"
                type="date"
                defaultValue={today}
                className="h-10 border-2 border-ink/30 bg-card px-3 text-sm focus:border-indigo-dye focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={committing}
              className="tag-shadow-sm h-10 border-2 border-ink bg-indigo-dye px-6 text-[11px] font-extrabold tracking-[0.22em] text-primary-foreground uppercase transition-colors hover:bg-ink disabled:opacity-60"
            >
              {committing ? "Committing…" : `Commit ${rows.length} AWBs & sync board`}
            </button>
            {commitState.error && (
              <p className="w-full border-2 border-destructive bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
                {commitState.error}
              </p>
            )}
          </form>
        </>
      )}
    </div>
  )
}
