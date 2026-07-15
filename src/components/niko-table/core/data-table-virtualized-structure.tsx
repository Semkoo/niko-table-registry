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
import { flexRender, type Row } from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import React from "react"
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
import { DataTableEmptyState } from "../components/data-table-empty-state"
import { DataTableRowContextMenu } from "../components/data-table-row-context-menu"
import { useResolvedRowContextMenuRenderer } from "../components/data-table-row-context-menu-slot"
import { createScrollHandler } from "../lib/create-scroll-handler"
import { DataTableColumnResizeHandle } from "../lib/column-resize-handle"
import { isInteractiveClickTarget } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"
import {
  flashCellKey,
  useDataTable,
  useDataTableActiveCell,
} from "./data-table-context"

// ============================================================================
// Row measurement helper
// ============================================================================

// Sums base + expanded sibling height (ResizeObserver only sees the base row).
// Disabled in Firefox where stale `getBoundingClientRect` causes measure loops.
//
// Prefers `ResizeObserverEntry.borderBoxSize` for the base row when TanStack
// Virtual passes the entry through — that height is computed off the same
// observation that fired the callback, so we skip a forced layout read.
// Falls back to `getBoundingClientRect` for the initial measure (no entry)
// and for the expanded sibling (not observed by the virtualizer).
const measureRowWithExpansion:
  | ((element: Element, entry?: ResizeObserverEntry | undefined) => number)
  | undefined =
  typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
    ? (element, entry) => {
        const baseHeight =
          entry?.borderBoxSize?.[0]?.blockSize ??
          element.getBoundingClientRect().height
        const next = element.nextElementSibling
        if (
          next &&
          next.getAttribute("data-slot") === "datatable-expanded-row"
        ) {
          return baseHeight + next.getBoundingClientRect().height
        }
        return baseHeight
      }
    : undefined

// ============================================================================
// ScrollEvent Type
// ============================================================================

export interface ScrollEvent {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  isTop: boolean
  isBottom: boolean
  percentage: number
}

// ============================================================================
// DataTableVirtualizedHeader
// ============================================================================

export interface DataTableVirtualizedHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

export const DataTableVirtualizedHeader = React.memo(
  function DataTableVirtualizedHeader({
    className,
    sticky = true,
  }: DataTableVirtualizedHeaderProps) {
    const { table } = useDataTable()
    // Dedicated context — only this header (and the body) re-render when the
    // grid's focused cell moves; other table consumers are untouched.
    const activeCell = useDataTableActiveCell()
    const resizing = table?.options.enableColumnResizing ?? false

    const headerGroups = table?.getHeaderGroups() ?? []

    if (headerGroups.length === 0) {
      return null
    }

    return (
      <TableHeader
        className={cn(
          sticky && "sticky top-0 z-30 bg-background",
          // Sticky elements don't paint the row's own border-b reliably — draw
          // the bottom rule as a pseudo-element so it stays crisp while scrolling.
          sticky &&
            "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-border",
          className,
        )}
      >
        {headerGroups.map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => {
              const size = header.column.columnDef.size
              const isActiveColumn =
                activeCell?.columnIds.has(header.column.id) ?? false
              return (
                <TableHead
                  key={header.id}
                  data-active-column={isActiveColumn ? "true" : undefined}
                  data-col-id={header.column.id}
                  // Pinned header cells stick with the body (same
                  // `getCommonPinningStyles`) and paint an opaque bg + right rule
                  // so scrolled columns pass cleanly underneath. Set an explicit
                  // width (mirroring the non-virtualized header) so the sticky
                  // offset math lines up with the body's pinned columns. The
                  // active column (focused cell) lights up grid-style.
                  className={cn(
                    header.column.getIsPinned() && "bg-background",
                    // Trailing `!` so the active tint wins over the base
                    // `bg-accent/30` / `text-accent-foreground` (equal-specificity
                    // utilities are otherwise source-order dependent in Tailwind).
                    isActiveColumn &&
                      "bg-primary/15! font-semibold! text-foreground!",
                    // Anchor the absolute resize handle to the cell's right edge.
                    resizing && "relative",
                  )}
                  style={{
                    // Resizing: width tracks `getSize()` (columnSizing-aware).
                    // Off: unchanged (columnDef.size, or auto when unset).
                    width: resizing
                      ? header.getSize()
                      : size
                        ? `${size}px`
                        : undefined,
                    ...getCommonPinningStyles(header.column, true),
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <DataTableColumnHeaderRoot column={header.column}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </DataTableColumnHeaderRoot>
                  )}
                  {resizing && header.column.getCanResize() && (
                    <DataTableColumnResizeHandle header={header} />
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
    )
  },
)

DataTableVirtualizedHeader.displayName = "DataTableVirtualizedHeader"

// ============================================================================
// DataTableVirtualizedFlexHeader
// ============================================================================

export interface DataTableVirtualizedFlexHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

/**
 * Flex-layout header — pairs with `DataTableVirtualizedDndBody` (row-DnD).
 * Mirrors the body's cell sizing so columns stay aligned.
 *
 * Use `DataTableVirtualizedHeader` for plain tables and
 * `DataTableVirtualizedDndHeader` for column-DnD tables.
 *
 * @example
 * <DataTableRowDndProvider data={data} onReorder={setData}>
 *   <DataTable height={500}>
 *     <DataTableVirtualizedFlexHeader />
 *     <DataTableVirtualizedDndBody />
 *   </DataTable>
 * </DataTableRowDndProvider>
 */
export const DataTableVirtualizedFlexHeader = React.memo(
  function DataTableVirtualizedFlexHeader({
    className,
    sticky = true,
  }: DataTableVirtualizedFlexHeaderProps) {
    const { table } = useDataTable()

    const headerGroups = table?.getHeaderGroups() ?? []

    if (headerGroups.length === 0) {
      return null
    }

    return (
      <TableHeader
        className={cn(
          "block",
          sticky && "sticky top-0 z-30 bg-background",
          // Sticky elements don't paint the row's own border-b reliably — draw
          // the bottom rule as a pseudo-element so it stays crisp while scrolling.
          sticky &&
            "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-border",
          className,
        )}
      >
        {headerGroups.map(headerGroup => (
          <TableRow key={headerGroup.id} className="flex w-full border-b">
            {headerGroup.headers.map(header => {
              const size = header.column.columnDef.size
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    size ? "shrink-0" : "min-w-0 flex-1",
                    "flex items-center",
                    header.column.getIsPinned() && "bg-background",
                  )}
                  style={{
                    width: size ? `${size}px` : undefined,
                    ...getCommonPinningStyles(header.column, true),
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <DataTableColumnHeaderRoot column={header.column}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </DataTableColumnHeaderRoot>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
    )
  },
)

DataTableVirtualizedFlexHeader.displayName = "DataTableVirtualizedFlexHeader"

// ============================================================================
// VirtualizedBodyRow — memoized to keep selection / expansion / column-vis
// changes from cascading into all visible rows
// ============================================================================

/**
 * Per-row component for `DataTableVirtualizedBody`. Wrapped with
 * `React.memo` so single-row state changes (selection, expansion) don't
 * reconcile every other visible row.
 *
 * The measure ref is wrapped in a stable callback by the parent so it
 * doesn't invalidate the memo on every parent render. `getRowClassName`
 * and `getCellClassName` are expected to be stable refs from the
 * consumer — pass them through `useCallback` to preserve memoization
 * across parent renders.
 *
 * Composite key (`${row.id}-${isExpanded}`) stays on the parent so the
 * row remounts on expansion toggle and `ResizeObserver` re-attaches.
 */
interface VirtualizedBodyRowProps<TData> {
  row: Row<TData>
  virtualIndex: number
  expandColumnId: string | undefined
  isExpanded: boolean
  isSelected: boolean
  /** This row holds the active cell — exposed as `data-active-row` for the gutter cross-highlight. */
  isActiveRow: boolean
  /** Column resizing is on — cells size from `column.getSize()` instead of `columnDef.size`. */
  columnSizingEnabled: boolean
  isClickable: boolean
  measureRef: ((node: HTMLTableRowElement | null) => void) | undefined
  onClick: (event: React.MouseEvent<HTMLElement>) => void
  getRowClassName?: (row: TData) => string | undefined
  getCellClassName?: (row: TData, columnId: string) => string | undefined
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
  /**
   * Per-row memo key. Change this string to force React.memo to re-render a
   * specific row when row-level state changes outside of TanStack Table's
   * tracked props (e.g. inline edit mode, optimistic state).
   */
  rowMemoKey: string
  /** Whole row is flashing (highlight-what-changed). */
  isRowFlashing: boolean
  /** Keys of individual flashing cells (`flashCellKey`). */
  flashingCellKeys: ReadonlySet<string>
  /**
   * Right-click menu items for this row. Must be a stable callback so
   * `React.memo` keeps holding. Return `null` to opt a specific row out.
   */
  renderRowContextMenu?: (row: TData) => React.ReactNode
}

/** Fade-pulse animation applied to a flashing cell (keyframe in the provider). */
const FLASH_ANIMATION = "niko-row-flash 1.2s ease-out"

const VirtualizedBodyRowInner = function VirtualizedBodyRow<TData>({
  row,
  virtualIndex,
  expandColumnId,
  isExpanded,
  isSelected,
  isActiveRow,
  columnSizingEnabled,
  isClickable,
  measureRef,
  onClick,
  getRowClassName,
  getCellClassName,
  columnLayoutSignature,
  rowMemoKey,
  isRowFlashing,
  flashingCellKeys,
  renderRowContextMenu,
}: VirtualizedBodyRowProps<TData>) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  // Cache the base-row DOM node so we can re-trigger measureRef when column
  // layout changes while the row is expanded (no remount = no automatic re-measure).
  const elementRef = React.useRef<HTMLTableRowElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      elementRef.current = node
      if (measureRef) measureRef(node)
    },
    [measureRef],
  )

  // Re-measure when column layout changes while expanded so the virtualizer
  // picks up the updated combined base + expanded-pane height.
  React.useEffect(() => {
    if (isExpanded && measureRef && elementRef.current) {
      measureRef(elementRef.current)
    }
  }, [isExpanded, rowMemoKey, columnLayoutSignature, measureRef])

  const rowElement = (
    <TableRow
      ref={setRef}
      data-index={virtualIndex}
      data-row-id={row.id}
      data-state={isSelected ? "selected" : undefined}
      data-active-row={isActiveRow ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "group data-[context-menu-open]:bg-muted/50",
        isClickable && "cursor-pointer",
        getRowClassName?.(row.original as TData),
      )}
    >
      {visibleCells.map(cell => {
        const size = cell.column.columnDef.size
        const flashing =
          isRowFlashing ||
          flashingCellKeys.has(flashCellKey(row.id, cell.column.id))
        const cellStyle = {
          // Resizing: width tracks `getSize()`; off: unchanged.
          width: columnSizingEnabled
            ? cell.column.getSize()
            : size
              ? `${size}px`
              : undefined,
          ...getCommonPinningStyles(cell.column, false),
          ...(flashing ? { animation: FLASH_ANIMATION } : {}),
        }

        return (
          <TableCell
            key={cell.id}
            data-flash={flashing ? "true" : undefined}
            data-col-id={cell.column.id}
            className={cn(
              "overflow-hidden",
              cell.column.getIsPinned() &&
                "bg-background group-hover:bg-muted/50 group-data-[context-menu-open]:bg-muted/50 group-data-[state=selected]:bg-muted",
              getCellClassName?.(row.original as TData, cell.column.id),
            )}
            style={cellStyle}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )

  // Stand up the context-menu shell only when the consumer returns items
  // for this row. Base UI merges its anchor ref with the virtualizer's
  // `measureRef` via the `render` prop, so row measurement is unaffected.
  const menuItems = renderRowContextMenu?.(row.original as TData)

  return (
    <>
      {menuItems ? (
        <DataTableRowContextMenu
          row={row.original as TData}
          trigger={rowElement}
        >
          {menuItems}
        </DataTableRowContextMenu>
      ) : (
        rowElement
      )}

      {isExpanded && expandCell && (
        <TableRow data-slot="datatable-expanded-row">
          <TableCell colSpan={visibleCells.length} className="p-0">
            {expandCell.column.columnDef.meta?.expandedContent?.(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// React.memo strips generics; cast back so call sites stay typed.
const VirtualizedBodyRow = React.memo(
  VirtualizedBodyRowInner,
) as typeof VirtualizedBodyRowInner

// ============================================================================
// DataTableVirtualizedBody
// ============================================================================

export interface DataTableVirtualizedBodyProps<TData> {
  children?: React.ReactNode
  estimateSize?: number
  overscan?: number
  /**
   * All rows are EXACTLY `estimateSize` tall — skip per-row `ResizeObserver`
   * measurement entirely. Every row is positioned at `index * estimateSize` with
   * zero measure/correct cycles, so scrolling is perfectly smooth (no vertical
   * jitter, and no re-layout that would jitter column widths). Use for uniform
   * fixed-height grids (single-line clamped cells). Incompatible with row
   * expansion / variable-height rows — leave `false` (default) for those.
   */
  fixedRowHeight?: boolean
  className?: string
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
  /**
   * Click is dispatched per-row from each row's `onClick`. Typed as
   * `React.MouseEvent<HTMLElement>` to match the other body
   * variants (`DataTableBody`, `DataTableDndBody`,
   * `DataTableVirtualizedDndBody`, etc.) so a single handler can be
   * passed through wrappers that switch between bodies. Consumers
   * needing the row element can `event.target.closest("tr[data-row-id]")`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
  /**
   * Fires when the last rendered virtual row is within
   * `prefetchThreshold` rows of the end of the dataset. Intended
   * as a prefetch trigger for infinite-scroll — pair it with tRPC's
   * `useInfiniteQuery.fetchNextPage()` so the next page is loaded
   * *before* the user reaches the bottom. Called at most once per
   * transition into the near-end zone (not every frame) so
   * consumers can wire it directly without worrying about
   * double-fires.
   *
   * Strictly better than `onScrolledBottom` for virtualized infinite
   * scroll because it's virtualizer-index-driven (not scroll-event-
   * driven), so it also catches: fast scrolls via scrollbar drag,
   * programmatic `scrollToIndex()` jumps, and initial renders where
   * the table isn't tall enough to require scrolling.
   */
  onNearEnd?: () => void
  /**
   * How many rows from the end of the dataset to trigger
   * `onNearEnd`. Default `10` — fires when the user is rendering
   * the last 10 loaded rows. Tune higher for more aggressive
   * prefetching (pre-fetch earlier), lower for more conservative.
   */
  prefetchThreshold?: number
  /** Return extra className(s) for a specific row. Called per-row during render. */
  getRowClassName?: (row: TData) => string | undefined
  /** Return extra className(s) for a specific cell. Called per-cell during render. */
  getCellClassName?: (row: TData, columnId: string) => string | undefined
  /**
   * Return a per-row memo invalidation key. When the returned string changes
   * for a specific row, React.memo re-renders that row even if TanStack Table
   * props (selection, expansion, column layout) are unchanged. Use this for
   * row-level external state that cell renderers depend on — e.g. inline edit
   * mode, optimistic overlays, or any closure-captured state in column
   * definitions that changes independently of the table's own state.
   *
   * @example
   * // Trigger re-render on inline edit toggle (only the edited row re-renders)
   * getRowMemoKey={(row) => (isEditing(row.id) ? "editing" : "")}
   */
  getRowMemoKey?: (row: TData) => string
  /**
   * Attach a native right-click context menu to each row. Return the menu
   * items for the given row, or `null` to give that row no menu. The popup
   * shell and portalling are handled internally. Wrap the callback in
   * `useCallback` so memoized rows don't re-render.
   */
  renderRowContextMenu?: (row: TData) => React.ReactNode
}

export function DataTableVirtualizedBody<TData>({
  children,
  estimateSize = 34,
  overscan = 20,
  fixedRowHeight = false,
  className,
  onScroll,
  onRowClick,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
  onNearEnd,
  prefetchThreshold = 10,
  renderRowContextMenu,
  getRowClassName,
  getCellClassName,
  getRowMemoKey,
}: DataTableVirtualizedBodyProps<TData>) {
  const {
    table,
    columns,
    registerRowScroller,
    flashingRowIds,
    flashingCellKeys,
  } = useDataTable()
  // Dedicated context — see the header note; memoized rows keep the actual
  // re-render cost to just the rows whose active state changed.
  const activeCell = useDataTableActiveCell()
  const { rows } = table.getRowModel()
  const activeRowRange = activeCell?.rowRange ?? null
  const resizing = table.options.enableColumnResizing ?? false

  // Hoist expand-column lookup above the virtualizer loop (was O(virtual_rows × cols) per frame).
  const expandColumnId = React.useMemo(
    () =>
      table.getAllColumns().find(col => col.columnDef.meta?.expandedContent)
        ?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `columns` is an intentional invalidation key; the TanStack table instance is stable across column swaps
    [table, columns],
  )

  const { columnVisibility, columnOrder, columnPinning, columnSizing } =
    table.getState()
  // String signature of the visible column layout. Memoized rows compare it
  // to invalidate on column add/remove / toggle / reorder / pin / resize.
  // `columns` must be included — add/remove (e.g. dynamic grid columns) does
  // not change visibility/order/pinning state, so omitting it left body rows
  // stuck with a stale cell set while the header showed the new columns.
  // For external row state (inline edits, optimistic overlays), pass
  // `getRowMemoKey`.
  const columnLayoutSignature = React.useMemo(
    () =>
      table
        .getVisibleLeafColumns()
        .map(c => {
          const pinned = c.getIsPinned()
          const base = pinned ? `${c.id}:${pinned}` : c.id
          return resizing ? `${base}:${c.getSize()}` : base
        })
        .join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      table,
      columns,
      columnVisibility,
      columnOrder,
      columnPinning,
      columnSizing,
      resizing,
    ],
  )
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)
  const tbodyRef = React.useRef<HTMLTableSectionElement | null>(null)

  const parentRef = React.useCallback(
    (node: HTMLTableSectionElement | null) => {
      tbodyRef.current = node
      if (node !== null) {
        const container = node.closest(
          '[data-slot="table-container"]',
        ) as HTMLDivElement | null
        setScrollElement(container)
      }
    },
    [],
  )

  // Lock column widths post auto-size: measure each <th>, enforce explicit
  // `size` as a minimum, scale to container, then switch to `table-layout: fixed`.
  // Without this, auto-layout shifts headers during virtual scroll as visible
  // content changes. useLayoutEffect avoids the auto→fixed flash.
  const columnLockRef = React.useRef(false)
  const lockedColumnCountRef = React.useRef(0)
  // Mirrored as state so row-render can gate `measureElement` on it. Attaching
  // the ResizeObserver before the lock would read inflated wrapped-text heights
  // and bake huge spacer gaps into the virtualizer.
  const [columnsLocked, setColumnsLocked] = React.useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs every render; guarded by refs
  React.useLayoutEffect(() => {
    const leafColumns = table.getVisibleLeafColumns()
    const currentColCount = leafColumns.length

    // Column resizing on: widths come from `column.getSize()` (React-controlled)
    // + `table-layout: fixed`, so the content-measure lock is neither needed nor
    // wanted (it would fight user resizes). Pinning uses those same sizes for
    // sticky `left`/`width` — if the table still collapses under Tailwind's
    // `w-full`, layout columns shrink while sticky cells stay at `getSize()`,
    // and the left pin overlays the first data column. Keep an explicit pixel
    // width (= sum of sizes) in sync with columnSizing so sticky and flow match.
    if (resizing) {
      const tableEl = tbodyRef.current?.closest<HTMLTableElement>(
        '[data-slot="table"]',
      )
      if (tableEl) {
        const totalDesiredWidth = leafColumns.reduce(
          (sum, col) => sum + col.getSize(),
          0,
        )
        tableEl.style.tableLayout = "fixed"
        tableEl.style.width = `${totalDesiredWidth}px`
        tableEl.style.minWidth = `${totalDesiredWidth}px`
      }
      if (!columnLockRef.current) {
        columnLockRef.current = true
        lockedColumnCountRef.current = currentColCount
        setColumnsLocked(true)
      }
      return
    }

    // Reset lock when column visibility changes (toggle columns on/off)
    if (
      columnLockRef.current &&
      lockedColumnCountRef.current !== currentColCount
    ) {
      columnLockRef.current = false
      setColumnsLocked(false)
      const tbody = tbodyRef.current
      const tableEl = tbody?.closest<HTMLTableElement>('[data-slot="table"]')
      if (tableEl) {
        tableEl.style.tableLayout = ""
        tableEl.style.width = ""
        tableEl.style.minWidth = ""
        tableEl
          .querySelectorAll<HTMLTableCellElement>(
            "thead [data-slot='table-head']",
          )
          .forEach(th => {
            th.style.width = ""
          })
      }
      // Bail so React commits the unlocked render before re-locking —
      // batching both updates would let `ResizeObserver` capture
      // inflated heights during the auto-layout pass.
      return
    }

    // Fast path — already locked, skip all DOM queries
    if (columnLockRef.current) return

    const tbody = tbodyRef.current
    if (!tbody || rows.length === 0 || !scrollElement) return

    // Verify data cells are rendered — the virtualizer may need an
    // extra render cycle after observing the scroll container before
    // it produces virtual items. Without this check we'd measure
    // header-only widths which are far too narrow.
    if (!tbody.querySelector("[data-slot='table-cell']")) return

    const tableEl = tbody.closest<HTMLTableElement>('[data-slot="table"]')
    if (!tableEl) return

    const ths = tableEl.querySelectorAll<HTMLTableCellElement>(
      "thead [data-slot='table-head']",
    )
    if (ths.length === 0) return

    // Force the table to be at least as wide as the sum of all column
    // sizes before measuring. Without this, `w-full` on <TableComponent>
    // constrains the table to the scroll container's width and the
    // auto-layout distributes compressed widths that then get locked in.
    const totalDesiredWidth = leafColumns.reduce(
      (sum, col) => sum + col.getSize(),
      0,
    )
    tableEl.style.minWidth = `${totalDesiredWidth}px`

    // Measure auto-computed widths. Auto-layout naturally gives content-heavy
    // columns (e.g. Name with chevron + icon + badge) more space than narrow
    // columns (e.g. Games showing "0"). We keep that behavior but enforce
    // each column's explicit `size` as a minimum — so a column with
    // `size: 180` is never locked narrower than 180px even if its visible
    // content happens to be short.
    const rawWidths: number[] = []
    ths.forEach(th => rawWidths.push(th.getBoundingClientRect().width))

    const effectiveWidths = rawWidths.map((raw, i) => {
      const explicitSize = leafColumns[i]?.columnDef.size
      return explicitSize !== undefined ? Math.max(raw, explicitSize) : raw
    })

    // Scale proportionally so widths sum to exactly the container width —
    // eliminates the subpixel rounding gap that `table-layout: fixed` +
    // raw pixel widths leaves.
    const effectiveSum = effectiveWidths.reduce((a, b) => a + b, 0)
    const containerWidth = tableEl.getBoundingClientRect().width
    const scale =
      containerWidth > 0 && effectiveSum > 0 ? containerWidth / effectiveSum : 1

    ths.forEach((th, i) => {
      th.style.width = `${(effectiveWidths[i] ?? 0) * scale}px`
    })
    tableEl.style.tableLayout = "fixed"

    columnLockRef.current = true
    lockedColumnCountRef.current = currentColCount
    setColumnsLocked(true)
  })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    enabled: !!scrollElement,
    // Fixed-height mode: no measurement — every row is exactly `estimateSize`,
    // so the virtualizer never measures/corrects and scroll stays jitter-free.
    measureElement: fixedRowHeight ? undefined : measureRowWithExpansion,
  })

  // Register this body's scroll capability with the table context so consumers
  // (e.g. an editable grid's keyboard engine) can scroll a row into view via the
  // stable `scrollRowIntoView` handle without touching the virtualizer directly.
  React.useEffect(() => {
    registerRowScroller((index, opts) =>
      rowVirtualizer.scrollToIndex(index, { align: opts?.align ?? "auto" }),
    )
    return () => registerRowScroller(null)
  }, [registerRowScroller, rowVirtualizer])

  // Passive scroll listener — shared `createScrollHandler` across all body variants.
  React.useEffect(() => {
    if (!scrollElement) return
    if (!onScroll && !onScrolledTop && !onScrolledBottom) return

    const handleScroll = createScrollHandler({
      onScroll,
      onScrolledTop,
      onScrolledBottom,
      scrollThreshold,
    })
    scrollElement.addEventListener("scroll", handleScroll, { passive: true })
    return () => scrollElement.removeEventListener("scroll", handleScroll)
  }, [
    scrollElement,
    onScroll,
    onScrolledTop,
    onScrolledBottom,
    scrollThreshold,
  ])

  const virtualItems = rowVirtualizer.getVirtualItems()
  const hasVirtualItems = virtualItems.length > 0

  // Calculate spacer heights for virtual scrolling
  const topSpacerHeight = hasVirtualItems ? virtualItems[0]!.start : 0
  const lastItem = hasVirtualItems
    ? virtualItems[virtualItems.length - 1]!
    : null
  const bottomSpacerHeight = lastItem
    ? rowVirtualizer.getTotalSize() - lastItem.end
    : 0

  // Virtualizer-index-driven prefetch: fires once on false→true transition,
  // catching fast scrolls, scrollbar drags, and short initial pages that
  // scroll-event-based triggers miss.
  const isNearEnd =
    onNearEnd !== undefined &&
    rows.length > 0 &&
    lastItem !== null &&
    lastItem.index >= rows.length - 1 - prefetchThreshold

  const wasNearEndRef = React.useRef(false)
  React.useEffect(() => {
    if (isNearEnd && !wasNearEndRef.current) {
      onNearEnd?.()
    }
    wasNearEndRef.current = isNearEnd
  }, [isNearEnd, onNearEnd])

  // One stable handler vs N inline closures — at 20 rows × 60fps that's
  // hundreds of allocations/sec saved during scroll.
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!onRowClick) return
      if (isInteractiveClickTarget(event.target as HTMLElement)) return

      // Resolve via stable `row.id` rather than a positional index —
      // sort/filter/reorder leave indices unstable but ids are
      // canonical. `table.getRow` is a Map lookup internally so this
      // stays O(1).
      const rowId = event.currentTarget.dataset.rowId
      if (rowId == null) return
      const row = table.getRow(rowId)
      if (!row) return
      onRowClick(row.original as TData, event)
    },
    [onRowClick, table],
  )

  // Stable wrapper around the virtualizer's measure callback. The
  // virtualizer recreates its `measureElement` on every render, which
  // would invalidate `React.memo` on the row component if passed
  // directly. The latest-ref pattern keeps the prop reference stable
  // while still calling through to the current measurer.
  const measureElementRef = React.useRef(rowVirtualizer.measureElement)
  measureElementRef.current = rowVirtualizer.measureElement
  const stableMeasureElement = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      measureElementRef.current(node)
    },
    [],
  )

  const isClickable = !!onRowClick
  const visibleColumnCount = table.getVisibleLeafColumns().length

  // Composable path: the per-row menu may come from the `renderRowContextMenu`
  // prop OR a nested `<DataTableRowContextMenuSlot>` child (prop wins).
  const resolvedRenderRowContextMenu = useResolvedRowContextMenuRenderer(
    renderRowContextMenu,
    children,
  )

  return (
    <TableBody ref={parentRef} className={cn(className)}>
      {/* Top spacer — colSpan keeps it within native table layout */}
      {topSpacerHeight > 0 && (
        <tr aria-hidden>
          <td
            colSpan={visibleColumnCount}
            style={{
              height: `${topSpacerHeight}px`,
              padding: 0,
              border: "none",
            }}
          />
        </tr>
      )}

      {/* Render visible rows */}
      {virtualItems.map(virtualRow => {
        const row = rows[virtualRow.index]
        if (!row) return null
        const isExpanded = row.getIsExpanded()

        // Composite key forces a remount on expansion toggle so
        // `ResizeObserver` re-attaches and re-reads the combined height.
        // DnD bodies use a stable key (preserving `useSortable`) and
        // re-measure imperatively instead.
        return (
          <VirtualizedBodyRow
            key={`${row.id}-${isExpanded}`}
            row={row as Row<TData>}
            virtualIndex={virtualRow.index}
            expandColumnId={expandColumnId}
            isExpanded={isExpanded}
            isSelected={row.getIsSelected()}
            isActiveRow={
              activeRowRange !== null &&
              virtualRow.index >= activeRowRange.min &&
              virtualRow.index <= activeRowRange.max
            }
            columnSizingEnabled={resizing}
            isClickable={isClickable}
            measureRef={
              fixedRowHeight
                ? undefined
                : columnsLocked
                  ? stableMeasureElement
                  : undefined
            }
            onClick={handleRowClick}
            getRowClassName={getRowClassName}
            getCellClassName={getCellClassName}
            columnLayoutSignature={columnLayoutSignature}
            rowMemoKey={
              getRowMemoKey ? getRowMemoKey(row.original as TData) : ""
            }
            isRowFlashing={flashingRowIds.has(row.id)}
            flashingCellKeys={flashingCellKeys}
            renderRowContextMenu={resolvedRenderRowContextMenu}
          />
        )
      })}

      {/* Bottom spacer */}
      {bottomSpacerHeight > 0 && (
        <tr aria-hidden>
          <td
            colSpan={visibleColumnCount}
            style={{
              height: `${bottomSpacerHeight}px`,
              padding: 0,
              border: "none",
            }}
          />
        </tr>
      )}

      {/*
        Composable children — Skeleton, EmptyBody, LoadingMore, and
        any other data-table body states are rendered here. Each
        self-gates on its own visibility, so the consumer just drops
        them in without needing conditional JSX.
      */}
      {children}
    </TableBody>
  )
}

DataTableVirtualizedBody.displayName = "DataTableVirtualizedBody"

// ============================================================================
// DataTableVirtualizedEmptyBody
// ============================================================================

export interface DataTableVirtualizedEmptyBodyProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Empty state component specifically for virtualized tables.
 * Uses flex layout to properly center content in virtualized table bodies.
 * Use composition pattern with DataTableEmpty* components for full customization.
 *
 * @example
 * <DataTableVirtualizedEmptyBody>
 *   <DataTableEmptyIcon>
 *     <PackageOpen className="size-12" />
 *   </DataTableEmptyIcon>
 *   <DataTableEmptyMessage>
 *     <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
 *     <DataTableEmptyDescription>
 *       Get started by adding your first product
 *     </DataTableEmptyDescription>
 *   </DataTableEmptyMessage>
 *   <DataTableEmptyFilteredMessage>
 *     No matches found
 *   </DataTableEmptyFilteredMessage>
 *   <DataTableEmptyActions>
 *     <Button onClick={handleAdd}>Add Product</Button>
 *   </DataTableEmptyActions>
 * </DataTableVirtualizedEmptyBody>
 */
export function DataTableVirtualizedEmptyBody({
  children,
  colSpan,
  className,
}: DataTableVirtualizedEmptyBodyProps) {
  const { table, columns, isLoading } = useDataTable()

  // Hooks first (rules-of-hooks), then early-return below skips work when
  // the table has rows.
  const tableState = table.getState()
  const isFiltered = React.useMemo(
    () =>
      (tableState.globalFilter && tableState.globalFilter.length > 0) ||
      (tableState.columnFilters && tableState.columnFilters.length > 0),
    [tableState.globalFilter, tableState.columnFilters],
  )

  // Early return after hooks - this prevents rendering when not needed
  const rowCount = table.getRowModel().rows.length
  if (isLoading || rowCount > 0) return null

  const visibleCount = table.getVisibleLeafColumns().length

  return (
    <TableRow>
      <TableCell
        colSpan={colSpan ?? (visibleCount || columns.length)}
        className={cn("text-center", className)}
      >
        <DataTableEmptyState isFiltered={isFiltered}>
          {children}
        </DataTableEmptyState>
      </TableCell>
    </TableRow>
  )
}

DataTableVirtualizedEmptyBody.displayName = "DataTableVirtualizedEmptyBody"

// ============================================================================
// DataTableVirtualizedSkeleton
// ============================================================================

export interface DataTableVirtualizedSkeletonProps {
  children?: React.ReactNode
  /**
   * Number of skeleton rows to display.
   * @default 5
   * @recommendation Set this to match your visible viewport for better UX
   */
  rows?: number
  /**
   * Estimated row height (should match estimateSize prop of DataTableVirtualizedBody).
   * @default 34
   */
  estimateSize?: number
  className?: string
  cellClassName?: string
  skeletonClassName?: string
}

export function DataTableVirtualizedSkeleton({
  children,
  rows = 5,
  estimateSize = 34,
  className,
  cellClassName,
  skeletonClassName,
}: DataTableVirtualizedSkeletonProps) {
  const { table, isLoading } = useDataTable()

  // Show skeleton only when loading
  if (!isLoading) return null

  // Get visible columns from table
  const visibleColumns = table.getVisibleLeafColumns()

  // If custom children provided, show single row with custom content
  if (children) {
    return (
      <TableRow>
        <TableCell
          colSpan={visibleColumns.length}
          className={cn("h-24 text-center", className)}
        >
          {children}
        </TableCell>
      </TableRow>
    )
  }

  // Show skeleton rows that mimic the virtualized table structure
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} style={{ height: `${estimateSize}px` }}>
          {visibleColumns.map((column, colIndex) => {
            const size = column.columnDef.size
            const cellStyle = size ? { width: `${size}px` } : undefined

            return (
              <TableCell
                key={colIndex}
                className={cn(cellClassName)}
                style={cellStyle}
              >
                <Skeleton className={cn("h-4 w-full", skeletonClassName)} />
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}

DataTableVirtualizedSkeleton.displayName = "DataTableVirtualizedSkeleton"

// ============================================================================
// DataTableVirtualizedLoading
// ============================================================================

export interface DataTableVirtualizedLoadingProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Loading state component specifically for virtualized tables.
 * Uses flex layout to properly center content in virtualized table bodies.
 */
export function DataTableVirtualizedLoading({
  children,
  colSpan,
  className,
}: DataTableVirtualizedLoadingProps) {
  const { table, columns, isLoading } = useDataTable()

  // Show loading only when loading
  if (!isLoading) return null

  const visibleCount = table.getVisibleLeafColumns().length

  return (
    <TableRow>
      <TableCell
        colSpan={colSpan ?? (visibleCount || columns.length)}
        className={className ?? "h-24 text-center"}
      >
        {children ?? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

DataTableVirtualizedLoading.displayName = "DataTableVirtualizedLoading"

// ============================================================================
// DataTableVirtualizedLoadingMore
// ============================================================================

export interface DataTableVirtualizedLoadingMoreProps {
  /**
   * Whether a next-page fetch is currently in flight. Typically
   * wired to tRPC's `useInfiniteQuery.isFetchingNextPage`. When
   * false, this component renders nothing.
   */
  isFetching: boolean
  /**
   * Optional custom content inside the loading-more row. Defaults
   * to a spinner + "Loading more…" label. Pass children to
   * customize the label per-table (e.g. "Loading more venues…").
   */
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Composable "loading more" row for infinite-scroll virtualized
 * tables. Renders at the end of the body when `isFetching` is true,
 * and nothing when false — designed to be dropped as a child of
 * `DataTableVirtualizedBody` alongside `DataTableVirtualizedSkeleton`
 * and `DataTableVirtualizedEmptyBody`.
 *
 * Sits outside the virtualizer row count (it's just appended to the
 * `TableBody` children), so it doesn't affect `estimateSize` math.
 *
 * @example
 * const query = api.thing.list.useInfiniteQuery(...);
 * <DataTableVirtualizedBody
 *   onScrolledBottom={() => {
 *     if (query.hasNextPage && !query.isFetchingNextPage) {
 *       void query.fetchNextPage();
 *     }
 *   }}
 * >
 *   <DataTableVirtualizedSkeleton rows={5} />
 *   <DataTableVirtualizedEmptyBody>No results</DataTableVirtualizedEmptyBody>
 *   <DataTableVirtualizedLoadingMore isFetching={query.isFetchingNextPage}>
 *     Loading more things…
 *   </DataTableVirtualizedLoadingMore>
 * </DataTableVirtualizedBody>
 */
export function DataTableVirtualizedLoadingMore({
  isFetching,
  children,
  colSpan,
  className,
}: DataTableVirtualizedLoadingMoreProps) {
  const { table, columns } = useDataTable()

  // Self-gating — nothing to render when no fetch is in flight.
  if (!isFetching) return null

  const visibleCount = table.getVisibleLeafColumns().length

  return (
    <TableRow data-slot="datatable-loading-more-row">
      <TableCell
        colSpan={colSpan ?? (visibleCount || columns.length)}
        className={cn(
          "py-3 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          <span>{children ?? "Loading more…"}</span>
        </span>
      </TableCell>
    </TableRow>
  )
}

DataTableVirtualizedLoadingMore.displayName = "DataTableVirtualizedLoadingMore"
