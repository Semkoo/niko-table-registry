"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */

/**
 * Fill the container with resizable columns.
 *
 * When column resizing is enabled, cells render at `column.getSize()` (a fixed
 * pixel width) instead of the flex-fill layout the non-resizable table uses.
 * If the columns' natural sizes don't add up to the scroll container's width,
 * that leaves dead space on the right. This hook removes it: on load (and when
 * the container grows or columns are toggled) it grows the RESIZABLE columns by
 * an equal share of the leftover space so they fill the available width (wide
 * and narrow columns end up closer), seeding `columnSizing` so `getSize()` —
 * the source of truth for both rendering and drag math — stays consistent.
 *
 * Rules:
 * - Only resizable columns are scaled; fixed utility columns (selection,
 *   actions, gutters — `enableResizing: false`) keep their size, and their
 *   width is subtracted from the space the resizable columns fill.
 * - Once the user manually resizes any column — drag, keyboard nudge, or
 *   double-click autosize — auto-fit stops for the life of the mount, so their
 *   widths are never overwritten.
 * - When the columns already meet or exceed the container width, it does
 *   nothing and horizontal scrolling takes over.
 * - With width PERSISTENCE wired in, the fitted widths are saved like any
 *   other `columnSizing` change, and on later visits they count as restored
 *   sizing — so auto-fit runs once per user, not once per session. That's the
 *   deliberate trade-off of "restored widths always win": the user keeps a
 *   stable layout, at the cost of not re-fitting when their viewport grows.
 *
 * Idempotent: after a fit the columns sum to the container width, so the next
 * run finds no surplus and makes no change.
 */
import type { Table } from "@tanstack/react-table"
import * as React from "react"

import { DEFAULT_MAX_COLUMN_SIZE, DEFAULT_MIN_COLUMN_SIZE } from "./constants"

export function useColumnAutoFit<TData>(
  table: Table<TData>,
  scrollElement: HTMLElement | null,
  enabled: boolean,
): void {
  // A manual resize permanently exits auto-fit for this mount — otherwise a
  // container resize would clobber the width the user just set. Drags latch
  // here via `isResizingColumn`; keyboard nudges, double-click autosize, and
  // consumer writes don't go through the drag handler, so they latch via the
  // `lastFitSizingRef` comparison in the fit effect below.
  const userResizedRef = React.useRef(false)
  const isResizingColumn = table.getState().columnSizingInfo.isResizingColumn
  React.useEffect(() => {
    if (isResizingColumn) userResizedRef.current = true
  }, [isResizingColumn])

  // JSON of the sizing this hook last applied. If `columnSizing` is ever
  // non-empty and NOT what the hook wrote, something else resized a column
  // (keyboard nudge, double-click autosize, a consumer `setColumnSizing`) —
  // treat it like a manual drag, or the next fit would redistribute the very
  // space the user just removed on purpose.
  const lastFitSizingRef = React.useRef<string | null>(null)

  // Sizes already present (restored from persistence, or provided by the
  // consumer) are respected as-is — auto-fit only fills the unsized first-load
  // case, so it never overwrites a saved column layout. Captured lazily on the
  // first *measured* pass (see below), NOT at mount: on a full page load the
  // first render is SSR/hydration where `columnSizing` is momentarily empty
  // (localStorage-backed widths arrive a tick later), and latching `false` there
  // would let auto-fit clobber the persisted widths. `null` = not yet captured.
  const hadInitialSizingRef = React.useRef<boolean | null>(null)

  // Reactively track the container's inner width so a fit re-runs when the
  // available space changes (window resize, sidebar collapse, panel dock).
  const [containerWidth, setContainerWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    if (!scrollElement) return
    const measure = () => setContainerWidth(scrollElement.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollElement)
    return () => observer.disconnect()
  }, [scrollElement])

  // Re-derive on any layout-affecting state change. `columnSizing` is included
  // so the effect converges (after a fit it re-runs, finds no surplus, stops).
  const { columnSizing, columnVisibility, columnOrder } = table.getState()

  React.useLayoutEffect(() => {
    // The width guard is load-bearing for the persistence race, not just a
    // no-op skip: persisted widths land (via the consumer's storage
    // subscription) at least one commit BEFORE the ResizeObserver's first
    // measurement can set `containerWidth`, so gating the capture below behind
    // a real measurement guarantees restored sizing is visible when it runs.
    // Capturing earlier (or measuring synchronously in render) would reopen
    // the reload clobber this ordering prevents.
    if (!enabled || containerWidth <= 0) return

    // Capture whether the consumer restored widths on the first measured pass —
    // by now hydration has settled and localStorage-backed `columnSizing` is in.
    if (hadInitialSizingRef.current === null) {
      hadInitialSizingRef.current =
        Object.keys(table.getState().columnSizing).length > 0
    }
    if (userResizedRef.current || hadInitialSizingRef.current) return

    // Sizing that this hook didn't write means a manual resize happened
    // through a path that bypasses `isResizingColumn` (keyboard, autosize,
    // consumer write) — latch and stop fitting for this mount.
    if (
      Object.keys(columnSizing).length > 0 &&
      JSON.stringify(columnSizing) !== lastFitSizingRef.current
    ) {
      userResizedRef.current = true
      return
    }

    const leafColumns = table.getVisibleLeafColumns()
    const resizable = leafColumns.filter(c => c.getCanResize())
    if (resizable.length === 0) return

    const fixedTotal = leafColumns
      .filter(c => !c.getCanResize())
      .reduce((sum, c) => sum + c.getSize(), 0)
    const resizableTotal = resizable.reduce((sum, c) => sum + c.getSize(), 0)
    const available = containerWidth - fixedTotal

    // Already fills or overflows (allow 1px for subpixel rounding) — let the
    // horizontal scrollbar handle it rather than shrinking columns to fit.
    if (resizableTotal <= 0 || resizableTotal >= available - 1) return

    // Split the leftover space evenly across the resizable columns (rather than
    // scaling proportionally), so wide and narrow columns end up closer.
    const perColumn = (available - resizableTotal) / resizable.length
    const next: Record<string, number> = {}
    let changed = false
    for (const column of resizable) {
      const min = column.columnDef.minSize ?? DEFAULT_MIN_COLUMN_SIZE
      const max = column.columnDef.maxSize ?? DEFAULT_MAX_COLUMN_SIZE
      const size = Math.round(
        Math.min(Math.max(column.getSize() + perColumn, min), max),
      )
      next[column.id] = size
      if (size !== column.getSize()) changed = true
    }
    if (!changed) return

    // Record what we're about to write so the external-change check above can
    // tell hook-applied sizing apart from a user's keyboard/autosize resize.
    const merged = { ...columnSizing, ...next }
    lastFitSizingRef.current = JSON.stringify(merged)
    table.setColumnSizing(() => merged)
    // `table` identity is stable; state slices below drive re-fitting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, containerWidth, columnSizing, columnVisibility, columnOrder])
}
