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
import { cn } from "@/lib/utils"
import * as React from "react"
import { createPortal } from "react-dom"

import {
  GRID_EDGE_SPEED,
  GRID_EDGE_ZONE,
  useDataGridFeatures,
  useDataGridInternals,
  useRegisterGridFeature,
  type RowReorderFeature,
} from "../core/data-grid-features"

/**
 * Read the row-reorder handle inside a gutter cell. Returns `null` when
 * `<DataGridRowReorder>` isn't mounted, so a gutter can render its drag grip
 * conditionally. Wire the grip's `onMouseDown` to `onRowReorderMouseDown`.
 */
export function useDataGridRowReorder(): RowReorderFeature | null {
  return useDataGridFeatures().rowReorder ?? null
}

/** Where the dragged row will land, plus the on-screen line geometry (fixed). */
interface DropTarget {
  targetRowId: string
  position: "before" | "after"
  top: number
  left: number
  width: number
}

export interface DataGridRowReorderProps {
  /** Extra classes for the drop-indicator line (defaults to a primary bar). */
  className?: string
}

/**
 * Opt-in drag-to-reorder ROWS for the grid (a gutter row handle). A grab
 * handle in the consumer's gutter calls `onRowReorderMouseDown`; drag up/down
 * and a drop line shows where the row will land; release commits the move as a
 * single undoable history entry. Grid-native (no dnd-kit) so it keeps the
 * grid cell chrome, column resize, virtualization, and scales — only the
 * dragged row moves (O(n) splice), nothing re-registers per row.
 *
 * Reorders the UNDERLYING row array by id, so it's correct with no active sort
 * (the grid's default). With a column sort applied, display order and storage
 * order diverge and a drop may not land where the line showed — disable the
 * handle while sorted if that matters for your data.
 *
 * The drag itself is pointer-only. For keyboard users, pair this with a
 * keyboard path in your row menu (e.g. "Move up" / "Move down" items calling
 * `grid.updateRows` with the same splice), and keep the grip focusable so it
 * is discoverable.
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataGridRowReorder />
 *   <DataTable>…</DataTable>
 * </DataGrid>
 */
export function DataGridRowReorder({
  className,
}: DataGridRowReorderProps = {}) {
  const { wrapperRef, pointerRef, envRef } = useDataGridInternals()

  const [draggingRowId, setDraggingRowId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null)

  const dragModeRef = React.useRef(false)
  const dragRowIdRef = React.useRef<string | null>(null)
  const dropTargetRef = React.useRef<DropTarget | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const dragCleanupRef = React.useRef<(() => void) | null>(null)

  // Move the dragged row to just before/after the target row in the underlying
  // array (by id — survives display order), as one history commit.
  const applyReorder = React.useCallback(
    (sourceId: string, target: DropTarget) => {
      if (sourceId === target.targetRowId) return
      envRef.current.grid.updateRows(rows => {
        const from = rows.findIndex(r => r.id === sourceId)
        if (from < 0) return rows
        const copy = rows.slice()
        const [moved] = copy.splice(from, 1)
        if (!moved) return rows
        const targetIdx = copy.findIndex(r => r.id === target.targetRowId)
        if (targetIdx < 0) return rows
        const insertAt = target.position === "after" ? targetIdx + 1 : targetIdx
        // Dropping the row back into its own slot is a no-op — return the
        // original array (===) so no phantom history entry is committed.
        if (insertAt === from) return rows
        copy.splice(insertAt, 0, moved)
        return copy
      })
    },
    [envRef],
  )

  // rAF loop while dragging: auto-scroll at the vertical edges (only when the
  // list actually overflows, so a short grid never scrolls) and resolve the drop
  // target by scanning the RENDERED rows for the one closest to the pointer —
  // robust where `elementFromPoint` returns nothing (gaps, the footer, past the
  // last row), which would otherwise leave the target stuck "after the last row"
  // and drop everything at the end.
  const reorderStep = React.useCallback(() => {
    if (!dragModeRef.current) {
      rafRef.current = null
      return
    }
    const scrollEl = wrapperRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    )
    const { y } = pointerRef.current
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect()
      const canScrollUp = scrollEl.scrollTop > 0
      const canScrollDown =
        scrollEl.scrollTop < scrollEl.scrollHeight - scrollEl.clientHeight - 1
      if (y < rect.top + GRID_EDGE_ZONE && canScrollUp)
        scrollEl.scrollTop -= GRID_EDGE_SPEED
      else if (y > rect.bottom - GRID_EDGE_ZONE && canScrollDown)
        scrollEl.scrollTop += GRID_EDGE_SPEED

      // Closest rendered row to the pointer → before/after by its midpoint.
      const rows = scrollEl.querySelectorAll<HTMLElement>("tr[data-row-id]")
      let best: DropTarget | null = null
      let bestDist = Infinity
      rows.forEach(tr => {
        const id = tr.getAttribute("data-row-id")
        if (!id) return
        const r = tr.getBoundingClientRect()
        const mid = r.top + r.height / 2
        const dist = Math.abs(y - mid)
        if (dist < bestDist) {
          bestDist = dist
          const position: "before" | "after" = y < mid ? "before" : "after"
          best = {
            targetRowId: id,
            position,
            top: position === "before" ? r.top : r.bottom,
            left: r.left,
            width: r.width,
          }
        }
      })
      if (best) {
        dropTargetRef.current = best
        setDropTarget(best)
      }
    }
    rafRef.current = requestAnimationFrame(reorderStep)
  }, [wrapperRef, pointerRef])

  const onRowReorderMouseDown = React.useCallback(
    (e: React.MouseEvent, rowId: string) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      // Seed the pointer — the rAF loop may run before the first mousemove.
      pointerRef.current = { x: e.clientX, y: e.clientY }
      dragModeRef.current = true
      dragRowIdRef.current = rowId
      dropTargetRef.current = null
      setDraggingRowId(rowId)
      setDropTarget(null)
      if (rafRef.current == null)
        rafRef.current = requestAnimationFrame(reorderStep)

      const onUp = () => {
        cleanup()
        dragModeRef.current = false
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        const source = dragRowIdRef.current
        const target = dropTargetRef.current
        if (source && target) applyReorder(source, target)
        setDraggingRowId(null)
        setDropTarget(null)
        dragRowIdRef.current = null
        dropTargetRef.current = null
      }
      const cleanup = () => {
        dragCleanupRef.current = null
        window.removeEventListener("mouseup", onUp)
      }
      dragCleanupRef.current = cleanup
      window.addEventListener("mouseup", onUp)
    },
    [pointerRef, reorderStep, applyReorder],
  )

  // Unmount safety: cancel a drag in flight.
  React.useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      dragCleanupRef.current?.()
    },
    [],
  )

  const payload = React.useMemo<RowReorderFeature>(
    () => ({ draggingRowId, onRowReorderMouseDown }),
    [draggingRowId, onRowReorderMouseDown],
  )
  useRegisterGridFeature("rowReorder", payload)

  // The drop indicator: a fixed-position primary line at the target row edge.
  // Portaled to the body so it's never clipped by the scroll container's
  // overflow. Fixed coords come straight from the target row's rect.
  if (!dropTarget || typeof document === "undefined") return null
  return createPortal(
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed z-50 h-0.5 rounded-full bg-primary",
        className,
      )}
      style={{
        top: dropTarget.top - 1,
        left: dropTarget.left,
        width: dropTarget.width,
      }}
    />,
    document.body,
  )
}
