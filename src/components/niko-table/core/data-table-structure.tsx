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
import { Skeleton } from "@/components/ui/skeleton"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import React from "react"
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
import { DataTableEmptyState } from "../components/data-table-empty-state"
import { DataTableRowContextMenu } from "../components/data-table-row-context-menu"
import { useResolvedRowContextMenuRenderer } from "../components/data-table-row-context-menu-slot"
import { DataTableColumnResizeHandle } from "../lib/column-resize-handle"
import { createScrollHandler } from "../lib/create-scroll-handler"
import { resolveColumnWidth, resolveFlexColumnIds } from "../lib/flex-columns"
import { resolveRowFromClick } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"
import { flashCellKey, useDataTable } from "./data-table-context"

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
// DataTableHeader
// ============================================================================

export interface DataTableHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

export const DataTableHeader = React.memo(function DataTableHeader({
  className,
  sticky = true,
}: DataTableHeaderProps) {
  const { table, headerMinWidths, setColumnResizePreview } = useDataTable()
  const resizing = table?.options.enableColumnResizing ?? false

  const headerGroups = table?.getHeaderGroups() ?? []

  if (headerGroups.length === 0) {
    return null
  }

  // Flex fill is on by default: resolve which column soaks up the leftover
  // width (explicit `meta.flex`, else the first non-pinned data column).
  const flexColumnIds = resolveFlexColumnIds(table)
  const columnSizing = table.getState().columnSizing

  return (
    <TableHeader
      className={cn(
        sticky && "sticky top-0 z-30 bg-background",
        // Ensure border is visible when sticky using pseudo-element
        sticky &&
          "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-border",
        className,
      )}
    >
      {headerGroups.map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            // A flex column has no explicit width — under `table-layout: fixed`
            // it soaks up the leftover row width. Not drag-resizable.
            const isFlex = flexColumnIds.has(header.column.id)
            const headerStyle = {
              width: resolveColumnWidth(header.column, {
                resizing,
                isFlex,
                columnSizing,
                headerMinWidths,
              }),
              ...getCommonPinningStyles(header.column, true),
            }

            return (
              <TableHead
                key={header.id}
                data-col-id={header.column.id}
                style={headerStyle}
                className={cn(
                  header.column.getIsPinned() && "bg-background",
                  // Anchor the absolute resize handle to the cell's right edge.
                  resizing && "relative overflow-hidden",
                )}
              >
                {header.isPlaceholder ? null : (
                  <DataTableColumnHeaderRoot column={header.column}>
                    {resizing &&
                    typeof header.column.columnDef.header === "string" ? (
                      <span className="inline-block max-w-full truncate">
                        {header.column.columnDef.header}
                      </span>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </DataTableColumnHeaderRoot>
                )}
                {resizing && header.column.getCanResize() && (
                  <DataTableColumnResizeHandle
                    header={header}
                    isFlex={isFlex}
                    setResizePreview={setColumnResizePreview}
                  />
                )}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
})

DataTableHeader.displayName = "DataTableHeader"

// ============================================================================
// BodyRow — memoized to avoid cascading re-renders across visible rows
// ============================================================================

/**
 * Per-row component for `DataTableBody`. Wrapped with `React.memo` so a
 * single-row state change (selection toggle, expansion) doesn't cascade
 * into a re-render across every visible row.
 *
 * Default shallow equality is sufficient: all props are either primitive
 * (`isExpanded`, `isSelected`, `isClickable`, `expandColumnId`) or stable
 * by contract (`row` is a TanStack row instance, kept stable across
 * renders unless the source data array reference changes).
 */
interface BodyRowProps {
  row: Row<unknown>
  /** Position in the current display model (post sort/filter) — for scroll/flash. */
  displayIndex: number
  expandColumnId: string | undefined
  isClickable: boolean
  isExpanded: boolean
  isSelected: boolean
  /**
   * Precomputed `columnId -> width` for every visible column (flex → undefined,
   * header-fit floor applied). Built once per body render so cells do an O(1)
   * lookup instead of recomputing width each. Stable identity, so `React.memo`
   * holds; the signature below invalidates it when a width changes.
   */
  columnWidths: ReadonlyMap<string, number | string | undefined>
  /** Column layout signature — invalidates React.memo on visibility/order/pinning/resize change. */
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
   * Right-click menu items for this row. Must be a stable callback (wrap in
   * `useCallback`) so `React.memo` keeps holding. Return `null` to opt a
   * specific row out of having a menu.
   */
  renderRowContextMenu?: (row: unknown) => React.ReactNode
}

/** Fade-pulse animation applied to a flashing cell (keyframe in the provider). */
const FLASH_ANIMATION = "niko-row-flash 1.2s ease-out"

const BodyRow = React.memo(function BodyRow({
  row,
  displayIndex,
  expandColumnId,
  isClickable,
  isExpanded,
  isSelected,
  columnWidths,
  isRowFlashing,
  flashingCellKeys,
  renderRowContextMenu,
}: BodyRowProps) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  const rowElement = (
    <TableRow
      data-row-index={displayIndex}
      data-row-id={row.id}
      data-row-type={
        (row.original as { rowType?: string } | undefined)?.rowType
      }
      data-parity={displayIndex % 2 === 0 ? "even" : "odd"}
      data-expanded={isExpanded ? "true" : undefined}
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        isClickable && "cursor-pointer",
        "group data-[context-menu-open]:bg-muted/50",
      )}
    >
      {visibleCells.map(cell => {
        const flashing =
          isRowFlashing ||
          flashingCellKeys.has(flashCellKey(row.id, cell.column.id))
        const cellStyle = {
          // Precomputed by the body: flex → undefined (fills), otherwise the
          // header-fit-floored width (or the declared size when resizing off).
          width: columnWidths.get(cell.column.id),
          ...getCommonPinningStyles(cell.column, false),
          ...(flashing ? { animation: FLASH_ANIMATION } : {}),
        }

        return (
          <TableCell
            key={cell.id}
            data-flash={flashing ? "true" : undefined}
            data-col-id={cell.column.id}
            style={cellStyle}
            className={cn(
              // Match virtualized/grid: clip overflow. `truncate` adds ellipsis
              // on top of shadcn TableCell's `whitespace-nowrap` so shrink-via-
              // resize doesn't paint into neighboring columns.
              "truncate",
              cell.column.getIsPinned() &&
                "bg-background group-hover:bg-muted/50 group-data-[context-menu-open]:bg-muted/50 group-data-[state=selected]:bg-muted",
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )

  // Only stand up the context-menu shell when the consumer supplies items
  // for this row — a `null` return keeps the plain row (and zero portal cost).
  const menuItems = renderRowContextMenu?.(row.original)

  return (
    <>
      {menuItems ? (
        <DataTableRowContextMenu row={row.original} trigger={rowElement}>
          {menuItems}
        </DataTableRowContextMenu>
      ) : (
        rowElement
      )}

      {expandCell && (
        <TableRow>
          <TableCell colSpan={visibleCells.length} className="p-0">
            {expandCell.column.columnDef.meta?.expandedContent?.(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
})

BodyRow.displayName = "BodyRow"

// ============================================================================
// DataTableBody
// ============================================================================

export interface DataTableBodyProps<TData> {
  children?: React.ReactNode
  className?: string
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
  /**
   * Click is dispatched per-row from each cell's onClick. The event's
   * `currentTarget` is the `<td>` cell — typed as `HTMLElement` to
   * stay consistent with the virtualized variants (which delegate on
   * `<tbody>`). Consumers needing the row element can
   * `event.target.closest("tr[data-row-id]")`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
  /**
   * Return a per-row memo invalidation key. When this key changes for a
   * specific row, only that row re-renders.
   */
  getRowMemoKey?: (row: TData) => string
  /**
   * Attach a native right-click context menu to each row. Return the menu
   * items (`ContextMenuItem`, `ContextMenuSeparator`, `ContextMenuSub`, …)
   * for the given row, or `null` to give that row no menu. The popup shell
   * and portalling are handled internally.
   *
   * Wrap the callback in `useCallback` so memoized rows don't re-render.
   */
  renderRowContextMenu?: (row: TData) => React.ReactNode
}

export function DataTableBody<TData>({
  children,
  className,
  onScroll,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
  onRowClick,
  getRowMemoKey,
  renderRowContextMenu,
}: DataTableBodyProps<TData>) {
  const {
    table,
    columns,
    isLoading,
    flashingRowIds,
    flashingCellKeys,
    registerRowScroller,
    headerMinWidths,
  } = useDataTable<TData>()
  const { rows } = table.getRowModel()
  const containerRef = React.useRef<HTMLTableSectionElement>(null)

  // Register a scroll handle SCOPED to this table's own container, so
  // `scrollRowIntoView` resolves the row within this table (a plain body has no
  // virtualizer to register otherwise, and the context's document-wide fallback
  // could match a same-index row in a different table on the page).
  React.useEffect(() => {
    registerRowScroller((index, opts) => {
      const container = containerRef.current?.closest(
        '[data-slot="table-container"]',
      )
      const row = container?.querySelector(`[data-row-index="${index}"]`)
      const block: ScrollLogicalPosition =
        opts?.align === undefined || opts.align === "auto"
          ? "nearest"
          : opts.align
      row?.scrollIntoView({ block })
    })
    return () => registerRowScroller(null)
  }, [registerRowScroller])

  // Passive scroll listener — shared `createScrollHandler` keeps all four body
  // variants in sync; passive flag unlocks the browser's scroll-thread path.
  React.useEffect(() => {
    const container = containerRef.current?.closest(
      '[data-slot="table-container"]',
    ) as HTMLDivElement
    if (!container) return
    if (!onScroll && !onScrolledTop && !onScrolledBottom) return

    const handleScroll = createScrollHandler({
      onScroll,
      onScrolledTop,
      onScrolledBottom,
      scrollThreshold,
    })
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [onScroll, onScrolledTop, onScrolledBottom, scrollThreshold])

  // Single delegated click handler on <tbody> — matches the DnD bodies and
  // removes one listener per row.
  const handleBodyClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const row = resolveRowFromClick(event.target as HTMLElement, table)
      if (!row) return
      onRowClick(
        row.original,
        event as unknown as React.MouseEvent<HTMLElement>,
      )
    },
    [onRowClick, table],
  )

  // Hoist expand-column lookup above the row map (was O(rows × cols) per render).
  // `columns` is in deps because the table reference is too stable on its own.
  const expandColumnId = React.useMemo(
    () =>
      table.getAllColumns().find(col => col.columnDef.meta?.expandedContent)
        ?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `columns` is an intentional invalidation key; the TanStack table instance is stable across column swaps
    [table, columns],
  )

  const { columnVisibility, columnOrder, columnPinning, columnSizing } =
    table.getState()
  const resizing = table.options.enableColumnResizing ?? false

  // Flex fill is on by default: which column soaks up the leftover row width.
  // `columnSizing` is a dep — resizing a flex column pins it and shifts the
  // fill to the next column.
  const flexColumnIds = React.useMemo(
    () => resolveFlexColumnIds(table),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      table,
      columnVisibility,
      columnOrder,
      columnPinning,
      columnSizing,
      resizing,
    ],
  )

  // Precompute every column's rendered width once (flex + header-fit rules),
  // so each cell is an O(1) lookup and header/body/lock all agree.
  const columnWidths = React.useMemo(() => {
    const widths = new Map<string, number | string | undefined>()
    for (const col of table.getVisibleLeafColumns()) {
      widths.set(
        col.id,
        resolveColumnWidth(col, {
          resizing,
          isFlex: flexColumnIds.has(col.id),
          columnSizing,
          headerMinWidths,
        }),
      )
    }
    return widths
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    table,
    flexColumnIds,
    columnSizing,
    columnVisibility,
    columnOrder,
    headerMinWidths,
    resizing,
  ])

  // String signature of the visible column layout. Memoized rows compare it
  // to invalidate on column add/remove / toggle / reorder / pin / width change
  // (resize OR header-fit/flex). `columns` must be included — add/remove does
  // not change visibility/order/pinning. For external row state (inline edits,
  // optimistic overlays), pass `getRowMemoKey`.
  const columnLayoutSignature = React.useMemo(
    () =>
      table
        .getVisibleLeafColumns()
        .map(c => {
          const pinned = c.getIsPinned()
          const base = pinned ? `${c.id}:${pinned}` : c.id
          return resizing ? `${base}:${columnWidths.get(c.id) ?? "flex"}` : base
        })
        .join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, columns, columnWidths, resizing],
  )

  const isClickable = !!onRowClick

  // Composable path: the per-row menu may come from the `renderRowContextMenu`
  // prop OR a nested `<DataTableRowContextMenuSlot>` child (prop wins).
  const resolvedRenderRowContextMenu = useResolvedRowContextMenuRenderer(
    renderRowContextMenu,
    children,
  )

  // The table's own inline sizing captured before resizing overrides it, so a
  // consumer that sets inline `table-layout` / `width` / `min-width` gets those
  // exact values back when resizing turns off — instead of them being blanked.
  const tableStyleSnapshotRef = React.useRef<{
    tableLayout: string
    width: string
    minWidth: string
  } | null>(null)

  // When resizing is on, lock `table-layout: fixed` and an explicit pixel width
  // (= sum of `getSize()`) so Tailwind `w-full` can't compress columns. Sticky
  // pin offsets use the same sizes — a compressed table would leave the left
  // pin overlaying the first data column.
  React.useLayoutEffect(() => {
    const tableEl = containerRef.current?.closest<HTMLTableElement>(
      '[data-slot="table"]',
    )
    if (!tableEl) return

    const restore = () => {
      const snap = tableStyleSnapshotRef.current
      if (!snap) return
      tableEl.style.tableLayout = snap.tableLayout
      tableEl.style.width = snap.width
      tableEl.style.minWidth = snap.minWidth
      tableStyleSnapshotRef.current = null
    }

    if (!resizing) {
      restore()
      return
    }

    // Capture the pre-override values once. Cleanup nulls the snapshot, so each
    // resizing pass re-captures the restored (clean) values before overriding.
    if (!tableStyleSnapshotRef.current) {
      tableStyleSnapshotRef.current = {
        tableLayout: tableEl.style.tableLayout,
        width: tableEl.style.width,
        minWidth: tableEl.style.minWidth,
      }
    }
    const leafColumns = table.getVisibleLeafColumns()
    // Min-width = sum of the rendered widths (header-fit floors included; a
    // flex column contributes its natural `getSize()` as its floor).
    const totalDesiredWidth = leafColumns.reduce((sum, col) => {
      const width = columnWidths.get(col.id)
      return sum + (typeof width === "number" ? width : col.getSize())
    }, 0)
    // A flex column has no fixed width, so the table must stretch to the
    // container (width 100%) and let that column soak up the surplus; the sized
    // columns still can't compress below their sum (minWidth).
    const hasFlex = flexColumnIds.size > 0
    tableEl.style.tableLayout = "fixed"
    tableEl.style.width = hasFlex ? "100%" : `${totalDesiredWidth}px`
    tableEl.style.minWidth = `${totalDesiredWidth}px`
    return restore
  }, [
    resizing,
    table,
    columnWidths,
    flexColumnIds,
    columnVisibility,
    columnOrder,
    columnPinning,
  ])

  return (
    <TableBody
      ref={containerRef}
      className={className}
      onClick={onRowClick ? handleBodyClick : undefined}
    >
      {/* Only show rows when not loading */}
      {!isLoading && rows?.length
        ? rows.map((row, displayIndex) => (
            <BodyRow
              key={row.id}
              row={row as Row<unknown>}
              displayIndex={displayIndex}
              expandColumnId={expandColumnId}
              isClickable={isClickable}
              isExpanded={row.getIsExpanded()}
              isSelected={row.getIsSelected()}
              columnWidths={columnWidths}
              columnLayoutSignature={columnLayoutSignature}
              rowMemoKey={
                getRowMemoKey ? getRowMemoKey(row.original as TData) : ""
              }
              isRowFlashing={flashingRowIds.has(row.id)}
              flashingCellKeys={flashingCellKeys}
              renderRowContextMenu={
                resolvedRenderRowContextMenu as
                  ((row: unknown) => React.ReactNode) | undefined
              }
            />
          ))
        : null}

      {children}
    </TableBody>
  )
}

DataTableBody.displayName = "DataTableBody"

// ============================================================================
// DataTableEmptyBody
// ============================================================================

export interface DataTableEmptyBodyProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Empty state component for data tables.
 * Use composition pattern with DataTableEmpty* components for full customization.
 *
 * @example
 * <DataTableEmptyBody>
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
 * </DataTableEmptyBody>
 */
export function DataTableEmptyBody({
  children,
  colSpan,
  className,
}: DataTableEmptyBodyProps) {
  const { table, columns, isLoading } = useDataTable()

  // Hooks first (rules-of-hooks), then early-return below skips work when
  // the empty state isn't visible.
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
        className={className}
      >
        <DataTableEmptyState isFiltered={isFiltered}>
          {children}
        </DataTableEmptyState>
      </TableCell>
    </TableRow>
  )
}

DataTableEmptyBody.displayName = "DataTableEmptyBody"

// ============================================================================
// DataTableSkeleton
// ============================================================================

export interface DataTableSkeletonProps {
  children?: React.ReactNode
  colSpan?: number
  /**
   * Number of skeleton rows to display.
   * @default 5
   * @recommendation Set this to match your page size for better UX (e.g., if page size is 10, set rows={10})
   */
  rows?: number
  className?: string
  cellClassName?: string
  skeletonClassName?: string
}

export function DataTableSkeleton({
  children,
  colSpan,
  rows = 5,
  className,
  cellClassName,
  skeletonClassName,
}: DataTableSkeletonProps) {
  const { table, columns, isLoading } = useDataTable()

  // Show skeleton only when loading
  if (!isLoading) return null

  // Get visible columns from table to match actual structure
  const visibleColumns = table.getVisibleLeafColumns()
  const numColumns = colSpan ?? (visibleColumns.length || columns.length)

  // If custom children provided, show single row with custom content
  if (children) {
    return (
      <TableRow>
        <TableCell
          colSpan={numColumns}
          className={cn("h-24 text-center", className)}
        >
          {children}
        </TableCell>
      </TableRow>
    )
  }

  // Show skeleton rows that mimic the table structure
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {visibleColumns.map((column, colIndex) => {
            const size = column.columnDef.size
            const cellStyle = size ? { width: `${size}px` } : undefined

            return (
              <TableCell
                key={colIndex}
                className={cellClassName}
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

DataTableSkeleton.displayName = "DataTableSkeleton"

// ============================================================================
// DataTableLoading
// ============================================================================

export interface DataTableLoadingProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

export function DataTableLoading({
  children,
  colSpan,
  className,
}: DataTableLoadingProps) {
  const { table, columns, isLoading } = useDataTable()

  // Self-gate on `isLoading` to match peer composables — otherwise the row
  // stays visible after data resolves.
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

DataTableLoading.displayName = "DataTableLoading"

// ============================================================================
// DataTableLoadingMore
// ============================================================================

export interface DataTableLoadingMoreProps {
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
 * Composable "loading more" row for infinite-scroll tables. Renders
 * a spinner + label row at the end of the body when `isFetching` is
 * true, and nothing when false — designed to be dropped as a child
 * of `DataTableBody` alongside `DataTableSkeleton` and
 * `DataTableEmptyBody`.
 *
 * Mirror of `DataTableVirtualizedLoadingMore` for non-virtualized
 * tables — same API, same styling, same self-gating behavior.
 *
 * @example
 * const query = api.thing.list.useInfiniteQuery(...);
 * <DataTableBody
 *   onScrolledBottom={() => {
 *     if (query.hasNextPage && !query.isFetchingNextPage) {
 *       void query.fetchNextPage();
 *     }
 *   }}
 * >
 *   <DataTableSkeleton rows={5} />
 *   <DataTableEmptyBody>No results</DataTableEmptyBody>
 *   <DataTableLoadingMore isFetching={query.isFetchingNextPage}>
 *     Loading more things…
 *   </DataTableLoadingMore>
 * </DataTableBody>
 */
export function DataTableLoadingMore({
  isFetching,
  children,
  colSpan,
  className,
}: DataTableLoadingMoreProps) {
  const { table, columns } = useDataTable()

  // Self-gating — nothing to render when no fetch is in flight.
  if (!isFetching) return null

  const visibleCount = table.getVisibleLeafColumns().length

  return (
    <TableRow data-slot="datatable-loading-more-row">
      <TableCell
        colSpan={colSpan ?? (visibleCount || columns.length)}
        className={cn("text-center text-xs text-muted-foreground", className)}
      >
        <span className="inline-flex items-center justify-center gap-2 py-3">
          <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted-foreground/60 border-t-transparent" />
          {children ?? "Loading more…"}
        </span>
      </TableCell>
    </TableRow>
  )
}

DataTableLoadingMore.displayName = "DataTableLoadingMore"
