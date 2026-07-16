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
import type { Column, Table } from "@tanstack/react-table"
import * as React from "react"

import { formatLabel } from "./format"

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

/**
 * The label text a column renders in its header. Mirrors the composable
 * title's precedence (`useDerivedColumnTitle`): `meta.label`, else a plain
 * string `header`, else the formatted column id — the same fallback
 * `DataTableColumnTitle` renders when nothing else is set. One gap this can't
 * see: a JSX `<DataTableColumnTitle title="..." />` override lives in rendered
 * output, not the column def — mirror such overrides into `meta.label` so
 * header-fit measures the right string.
 */
function headerLabel<TData>(column: Column<TData, unknown>): string | null {
  const columnDef = column.columnDef
  if (columnDef.meta?.label) return columnDef.meta.label
  if (typeof columnDef.header === "string") return columnDef.header
  return formatLabel(column.id)
}

/** Content equality so a re-measure with identical results keeps identity. */
function minWidthsEqual(
  a: ReadonlyMap<string, number>,
  b: ReadonlyMap<string, number>,
): boolean {
  if (a.size !== b.size) return false
  for (const [id, width] of b) {
    if (a.get(id) !== width) return false
  }
  return true
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
    .map(c => `${c.id}:${headerLabel(c) ?? ""}:${c.getCanSort() ? 1 : 0}`)
    .join("|")

  // Measure-then-store is the canonical layout-measurement pattern (same as
  // `useColumnAutoFit`): it needs the rendered DOM (header font), so it can't
  // run during render. The one extra commit it triggers is intended.
  React.useLayoutEffect(() => {
    // Content-equal results keep the previous Map identity — downstream
    // `columnWidths` memos and memoized body rows only re-render when a floor
    // actually changed, not on every re-measure.
    const store = (next: ReadonlyMap<string, number>) =>
      setMinWidths(prev => (minWidthsEqual(prev, next) ? prev : next))

    if (!enabled || !scrollElement) {
      store(EMPTY_MIN_WIDTHS)
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
      store(EMPTY_MIN_WIDTHS)
      return
    }
    const cs = getComputedStyle(fontEl)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`

    const next = new Map<string, number>()
    for (const column of leafColumns) {
      // Floors apply only to resizable columns. Fixed utility columns
      // (selection, actions, gutters — `enableResizing: false`) keep their
      // declared size: they often have no visible label, and the formatted-id
      // fallback would otherwise invent a phantom floor for them.
      if (!column.getCanResize()) continue
      const label = headerLabel(column)
      if (!label) continue
      const textWidth = ctx.measureText(label).width
      const chrome =
        BASE_HEADER_CHROME_PX + (column.getCanSort() ? SORT_AFFORDANCE_PX : 0)
      next.set(column.id, Math.ceil(textWidth) + chrome)
    }
    store(next)
    // `leafColumns` identity churns each render; `signature` is the stable key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scrollElement, signature])

  return minWidths
}
