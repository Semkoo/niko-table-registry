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
import { DEFAULT_MAX_COLUMN_SIZE, DEFAULT_MIN_COLUMN_SIZE } from "./constants"

/** Room for cell chrome the text measurement doesn't cover. */
const AUTOSIZE_CELL_PADDING = 24 // horizontal padding + buffer
const AUTOSIZE_HEADER_CHROME = 52 // sort/menu trigger + resize grip

/** Re-export for consumers that imported sizes from this module. */
export { DEFAULT_MAX_COLUMN_SIZE, DEFAULT_MIN_COLUMN_SIZE }

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
  /**
   * This column is currently the flex (fill) column. Flex columns have no width
   * TanStack can drive, so they resize through a custom pointer drag that starts
   * from the rendered width (no jump) and, on release, writes an explicit width
   * — which pins the column and hands the fill to the next eligible column.
   */
  isFlex?: boolean
  /**
   * Drive the resize preview line during a flex drag (from the DataTable
   * context). Passed `{ resizingColumnId, deltaOffset }` while dragging, `null`
   * on release.
   */
  setResizePreview?: (
    info: { resizingColumnId: string | null; deltaOffset: number } | null,
  ) => void
}

export function DataTableColumnResizeHandle<TData>({
  header,
  isFlex = false,
  setResizePreview,
}: DataTableColumnResizeHandleProps<TData>) {
  const isResizing = header.column.getIsResizing()
  const resize = header.getResizeHandler()
  const def = header.column.columnDef
  const min = def.minSize ?? DEFAULT_MIN_COLUMN_SIZE
  const max = def.maxSize ?? DEFAULT_MAX_COLUMN_SIZE

  // `fallbackWidth` seeds the first nudge for a flex column (no `columnSizing`
  // entry yet) from its rendered width so the arrow key doesn't jump it to the
  // declared `size`. Non-flex columns fall back to `getSize()` as before.
  const nudge = (delta: number, fallbackWidth?: number) => {
    header.getContext().table.setColumnSizing(prev => {
      const current =
        prev[header.column.id] ?? fallbackWidth ?? header.column.getSize()
      const next = Math.min(Math.max(current + delta, min), max)
      return { ...prev, [header.column.id]: next }
    })
  }

  // Custom drag for the flex column: measure its rendered (filled) width as the
  // start so there's no jump, follow the cursor via the preview line, and write
  // an explicit width on release (which releases it from flex).
  const startFlexResize = (
    startClientX: number,
    handleEl: HTMLElement | null,
  ) => {
    const thEl = handleEl?.closest<HTMLElement>("[data-col-id]")
    if (!thEl || !setResizePreview) return
    const startWidth = thEl.getBoundingClientRect().width
    const id = header.column.id
    setResizePreview({ resizingColumnId: id, deltaOffset: 0 })
    const onMove = (ev: PointerEvent) => {
      setResizePreview({
        resizingColumnId: id,
        deltaOffset: ev.clientX - startClientX,
      })
    }
    const teardown = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      setResizePreview(null)
    }
    // Commit the new width only on a real release. A cancelled pointer (e.g. the
    // browser stealing the gesture) just tears down and keeps the column flexing.
    const onUp = (ev: PointerEvent) => {
      const next = Math.min(
        Math.max(startWidth + (ev.clientX - startClientX), min),
        max,
      )
      header
        .getContext()
        .table.setColumnSizing(prev => ({ ...prev, [id]: next }))
      teardown()
    }
    const onCancel = () => teardown()
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
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
      onMouseDown={e => {
        // Keep column-DnD header listeners from treating a resize drag as a
        // reorder start (handle lives inside the sortable `<th>`).
        e.stopPropagation()
        // Flex columns resize via the pointer-based custom drag below.
        if (!isFlex) resize(e)
      }}
      onTouchStart={e => {
        e.stopPropagation()
        if (!isFlex) resize(e)
      }}
      onDoubleClick={e => autosizeColumn(header, e.currentTarget)}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => {
        e.stopPropagation()
        if (isFlex) {
          e.preventDefault()
          startFlexResize(e.clientX, e.currentTarget)
        }
      }}
      onKeyDown={e => {
        const step = e.shiftKey
          ? KEYBOARD_RESIZE_STEP_LARGE
          : KEYBOARD_RESIZE_STEP
        // Flex columns have no `columnSizing` entry, so seed the first nudge
        // from the rendered width to avoid jumping to the declared `size`.
        const fallbackWidth = isFlex
          ? e.currentTarget.closest("[data-col-id]")?.getBoundingClientRect()
              .width
          : undefined
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          nudge(-step, fallbackWidth)
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          nudge(step, fallbackWidth)
        } else if (e.key === "Enter") {
          e.preventDefault()
          autosizeColumn(header, e.currentTarget)
        }
      }}
      className="group/resize absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none justify-end outline-none select-none"
    >
      {/* Idle: invisible — an always-on grip bar reads as a header divider
          and drifts 1–2px from real cell `border-r`. Show on hover/focus/drag. */}
      <div
        className={cn(
          "my-1.5 w-px rounded bg-border opacity-0 transition-all",
          "group-hover/resize:my-0 group-hover/resize:w-0.5 group-hover/resize:bg-primary group-hover/resize:opacity-100",
          "group-focus-visible/resize:my-0 group-focus-visible/resize:w-0.5 group-focus-visible/resize:bg-primary group-focus-visible/resize:opacity-100",
          isResizing && "my-0 w-0.5 bg-primary opacity-100",
        )}
      />
    </div>
  )
}
