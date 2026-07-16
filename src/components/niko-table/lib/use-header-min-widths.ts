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
import type { Table } from "@tanstack/react-table"
import * as React from "react"

// Non-label chrome inside a header cell: horizontal padding + the resize
// handle + a little slack. Added to the measured label width so the floor
// leaves the label breathing room, not a pixel-tight fit.
const BASE_HEADER_CHROME_PX = 28
// A sortable column also renders a sort trigger next to the label.
const SORT_AFFORDANCE_PX = 24

const EMPTY_MIN_WIDTHS: ReadonlyMap<string, number> = new Map()

// One reusable off-DOM canvas: `measureText` never touches layout, so measuring
// every header costs no reflow (unlike reading `scrollWidth` per cell).
let measureCanvas: HTMLCanvasElement | null = null
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null
  if (!measureCanvas) measureCanvas = document.createElement("canvas")
  return measureCanvas.getContext("2d")
}

/** The label text a column renders in its header, or `null` if not measurable. */
function headerLabel(columnDef: {
  meta?: { label?: string }
  header?: unknown
}): string | null {
  if (columnDef.meta?.label) return columnDef.meta.label
  if (typeof columnDef.header === "string") return columnDef.header
  return null
}

/**
 * Measure the natural width each column's header needs so a column is never
 * rendered so narrow that its label truncates on load (header-fit).
 *
 * Returns `columnId -> minimum width in px` (label width + header chrome). The
 * caller floors each un-resized column at this width; a column the user has
 * explicitly resized is left alone. Pure measurement — nothing is written to
 * `columnSizing`, so it never persists or goes stale.
 *
 * Recomputes only when the visible columns, their labels, or the header font
 * change — measurement itself is O(columns) with zero reflow.
 */
export function useHeaderMinWidths<TData>(
  table: Table<TData>,
  scrollElement: HTMLElement | null,
  enabled: boolean,
): ReadonlyMap<string, number> {
  const [minWidths, setMinWidths] =
    React.useState<ReadonlyMap<string, number>>(EMPTY_MIN_WIDTHS)

  const leafColumns = table.getVisibleLeafColumns()
  // Signature: recompute when the visible set, a label, or sortability changes.
  const signature = leafColumns
    .map(
      c =>
        `${c.id}:${headerLabel(c.columnDef) ?? ""}:${c.getCanSort() ? 1 : 0}`,
    )
    .join("|")

  // Measure-then-store is the canonical layout-measurement pattern (same as
  // `useColumnAutoFit`): it needs the rendered DOM (header font), so it can't
  // run during render. The one extra commit it triggers is intended.
  React.useLayoutEffect(() => {
    if (!enabled || !scrollElement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMinWidths(EMPTY_MIN_WIDTHS)
      return
    }

    const ctx = getMeasureContext()
    // Read the real header font (family/size/weight) so measurement matches the
    // rendered label. Prefer the composable title element (semibold); fall back
    // to the header cell itself so raw string headers are still measurable.
    const fontEl =
      scrollElement.querySelector<HTMLElement>(
        'thead [data-slot="column-title"]',
      ) ?? scrollElement.querySelector<HTMLElement>("thead th[data-col-id]")
    if (!ctx || !fontEl) {
      // No header rendered yet / nothing to measure — drop any stale floors.
      setMinWidths(EMPTY_MIN_WIDTHS)
      return
    }
    const cs = getComputedStyle(fontEl)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`

    const next = new Map<string, number>()
    for (const column of leafColumns) {
      const label = headerLabel(column.columnDef)
      if (!label) continue
      const textWidth = ctx.measureText(label).width
      const chrome =
        BASE_HEADER_CHROME_PX + (column.getCanSort() ? SORT_AFFORDANCE_PX : 0)
      next.set(column.id, Math.ceil(textWidth) + chrome)
    }
    setMinWidths(next)
    // `leafColumns` identity churns each render; `signature` is the stable key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scrollElement, signature])

  return minWidths
}
