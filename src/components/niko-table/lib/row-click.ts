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
 *
 * Also suppresses when the user has an active text selection — accidental
 * row clicks while drag-selecting cell text are a common annoyance,
 * especially on rows that navigate to a detail view on click.
 */
export function isInteractiveClickTarget(target: HTMLElement): boolean {
  // Drag-selected text: a click that ends a selection should not navigate.
  // `window.getSelection` may be undefined in some environments (jsdom
  // edge cases / non-browser SSR), so guard both shapes.
  const selection =
    typeof window !== "undefined" ? window.getSelection?.() : null
  if (selection && !selection.isCollapsed && selection.toString().length > 0) {
    return true
  }

  return Boolean(
    target.closest("button") ||
    target.closest("input") ||
    target.closest("textarea") ||
    target.closest("select") ||
    target.closest("a") ||
    target.closest("label") ||
    target.closest("[contenteditable]") ||
    target.closest('[role="button"]') ||
    target.closest('[role="checkbox"]') ||
    target.closest('[role="combobox"]') ||
    target.closest('[role="menuitem"]') ||
    target.closest('[role="textbox"]') ||
    target.closest("[data-radix-collection-item]") ||
    target.closest('[data-slot="checkbox"]') ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
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
