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
 * Drag-to-resize / double-click-to-autosize grip used by DataTableHeader and
 * DataTableVirtualizedHeader when `enableColumnResizing` is on. Lives in core
 * so both bodies can import it without pulling the opt-in marker package.
 */
import { type Header } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

/** Room for cell chrome the text measurement doesn't cover. */
const AUTOSIZE_CELL_PADDING = 24 // horizontal padding + buffer
const AUTOSIZE_HEADER_CHROME = 52 // sort/menu trigger + resize grip

/** Column-width bounds used when a column omits `minSize` / `maxSize`. */
export const DEFAULT_MIN_COLUMN_SIZE = 40
export const DEFAULT_MAX_COLUMN_SIZE = 1000
/** Keyboard resize step (px); the larger step applies while Shift is held. */
const KEYBOARD_RESIZE_STEP = 8
const KEYBOARD_RESIZE_STEP_LARGE = 40

/**
 * Tightest width that fits every TEXT node in an element. Uses a DOM Range
 * so `w-full` + `truncate` wrappers — whose `scrollWidth` echoes the current
 * cell width — don't hide the natural content width. Autosize can grow AND
 * shrink to fit.
 */
function widestTextWidth(el: Element): number {
  const range = document.createRange()
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let max = 0
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent || n.textContent.trim() === "") continue
    range.selectNodeContents(n)
    max = Math.max(max, range.getBoundingClientRect().width)
  }
  return max
}

/**
 * Autosize a column to fit its content — measures the widest rendered
 * cell/header text (mounted cells only — for virtualized tables, what's on
 * screen) and sets that column's size.
 */
function autosizeColumn<TData>(
  header: Header<TData, unknown>,
  handle: Element,
) {
  const root = handle.closest('[data-slot="table"]')
  if (!root) return
  const cells = root.querySelectorAll<HTMLElement>(
    `[data-col-id="${CSS.escape(header.column.id)}"]`,
  )
  let content = 0
  cells.forEach(c => {
    const isHeader = c.getAttribute("data-slot") === "table-head"
    const chrome = isHeader ? AUTOSIZE_HEADER_CHROME : AUTOSIZE_CELL_PADDING
    content = Math.max(content, widestTextWidth(c) + chrome)
  })
  if (content <= 0) return
  const def = header.column.columnDef
  const width = Math.min(
    Math.max(Math.ceil(content), def.minSize ?? DEFAULT_MIN_COLUMN_SIZE),
    def.maxSize ?? DEFAULT_MAX_COLUMN_SIZE,
  )
  header
    .getContext()
    .table.setColumnSizing(prev => ({ ...prev, [header.column.id]: width }))
}

/**
 * Drag-to-resize / double-click-to-autosize grip on a header's right edge.
 * Keyboard-operable (WAI-ARIA window-splitter): focusable, Arrow Left/Right
 * nudge the width (Shift = larger step), Enter autosizes; exposes
 * `aria-value*`.
 */
export interface DataTableColumnResizeHandleProps<TData> {
  header: Header<TData, unknown>
}

export function DataTableColumnResizeHandle<TData>({
  header,
}: DataTableColumnResizeHandleProps<TData>) {
  const isResizing = header.column.getIsResizing()
  const resize = header.getResizeHandler()
  const def = header.column.columnDef
  const min = def.minSize ?? DEFAULT_MIN_COLUMN_SIZE
  const max = def.maxSize ?? DEFAULT_MAX_COLUMN_SIZE

  const nudge = (delta: number) => {
    header.getContext().table.setColumnSizing(prev => {
      const current = prev[header.column.id] ?? header.column.getSize()
      const next = Math.min(Math.max(current + delta, min), max)
      return { ...prev, [header.column.id]: next }
    })
  }

  return (
    <div
      data-slot="column-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column (arrow keys, or double-click to fit)"
      aria-valuenow={header.column.getSize()}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onMouseDown={resize}
      onTouchStart={resize}
      onDoubleClick={e => autosizeColumn(header, e.currentTarget)}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        const step = e.shiftKey
          ? KEYBOARD_RESIZE_STEP_LARGE
          : KEYBOARD_RESIZE_STEP
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          nudge(-step)
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          nudge(step)
        } else if (e.key === "Enter") {
          e.preventDefault()
          autosizeColumn(header, e.currentTarget)
        }
      }}
      className="group/resize absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none justify-end outline-none select-none"
    >
      {/* Faint grip always visible (discoverable); a full primary bar on
          hover, keyboard focus, or active drag. */}
      <div
        className={cn(
          "my-1.5 w-px rounded bg-border transition-all",
          "group-hover/resize:my-0 group-hover/resize:w-0.5 group-hover/resize:bg-primary",
          "group-focus-visible/resize:my-0 group-focus-visible/resize:w-0.5 group-focus-visible/resize:bg-primary",
          isResizing && "my-0 w-0.5 bg-primary",
        )}
      />
    </div>
  )
}
