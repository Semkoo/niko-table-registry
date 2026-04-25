/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Shared row-click guard. Centralized so the interactive-element list
 * stays in sync across all body variants.
 */
import type { Table } from "@tanstack/react-table"

/**
 * Returns `true` when the click landed on (or inside) an interactive
 * element that should suppress `onRowClick`.
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
 * For delegated `<tbody>` handlers. Returns the matched row, or `null`
 * if the click should be ignored (interactive target or no row found).
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
