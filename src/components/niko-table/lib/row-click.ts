/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Shared row-click guard + row resolution used by every body variant
 * (`data-table-structure`, `data-table-dnd-structure`, and the two
 * virtualized counterparts). The exact same interactive-element list
 * was inlined in 6 places — adding a new `data-slot` to ignore meant
 * editing six files. Centralized here so the guard stays in sync.
 */
import type { Table } from "@tanstack/react-table"

/**
 * `true` when the click landed on (or inside) an interactive element
 * that should suppress the row-level `onRowClick` — e.g. action
 * buttons, links, checkboxes, or any radix collection item that
 * dispatches its own behavior on click.
 */
export function isInteractiveClickTarget(target: HTMLElement): boolean {
  return Boolean(
    target.closest("button") ||
    target.closest("input") ||
    target.closest("a") ||
    target.closest('[role="button"]') ||
    target.closest('[role="checkbox"]') ||
    target.closest("[data-radix-collection-item]") ||
    target.closest('[data-slot="checkbox"]') ||
    target.tagName === "INPUT" ||
    target.tagName === "BUTTON" ||
    target.tagName === "A",
  )
}

/**
 * For delegated `<tbody>` handlers: returns the matched row (typed
 * against the caller's `TData`) or `null` when the click should be
 * ignored — either it landed on an interactive descendant or no row
 * could be resolved from the closest `tr[data-row-id]`.
 */
export function resolveRowFromClick<TData>(
  target: HTMLElement,
  table: Table<TData>,
) {
  if (isInteractiveClickTarget(target)) return null
  const rowEl = target.closest("tr[data-row-id]")
  if (!rowEl) return null
  const rowId = rowEl.getAttribute("data-row-id")
  if (rowId === null) return null
  return table.getRow(rowId) ?? null
}
