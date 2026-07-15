"use client"

/**
 * niko-table/grid — the full-featured editable DataGrid.
 *
 * Every capability, composed as opt-in children of <DataGrid>: clipboard,
 * fill handle, drag-to-move, drag-to-reorder rows, cross-highlight, dynamic
 * columns, column resize, undo/redo, CSV export, a selection status bar, and
 * six cell types (text / number / currency / checkbox / date / select). Remove
 * any child and the grid drops that capability — and its listeners — entirely.
 */
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnHideOptions } from "@/components/niko-table/components/data-table-column-hide"
import { DataTableColumnPinOptions } from "@/components/niko-table/components/data-table-column-pin"
import { DataTableColumnSortOptions } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableExportButton } from "@/components/niko-table/components/data-table-export-button"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableFilterMenu } from "@/components/niko-table/components/data-table-filter-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableSelectionBar } from "@/components/niko-table/components/data-table-selection-bar"
import { DataTableSortMenu } from "@/components/niko-table/components/data-table-sort-menu"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewDndMenu } from "@/components/niko-table/components/data-table-view-dnd-menu"
import { DataTable } from "@/components/niko-table/core/data-table"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import { useColumnHeaderContext } from "@/components/niko-table/components/data-table-column-header"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridCheckboxCell } from "@/components/niko-table/grid/cells/grid-checkbox-cell"
import { GridDateCell } from "@/components/niko-table/grid/cells/grid-date-cell"
import { GridSelectCell } from "@/components/niko-table/grid/cells/grid-select-cell"
import {
  GridNumberCell,
  GridTextCell,
} from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridAddColumnButton } from "@/components/niko-table/grid/components/grid-add-column"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { GridColumnMenuOptions } from "@/components/niko-table/grid/components/grid-column-menu"
import { DataGridCrossHighlight } from "@/components/niko-table/grid/components/grid-cross-highlight"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import { DataGridMove } from "@/components/niko-table/grid/components/grid-move"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridRowReorder,
  useDataGridRowReorder,
} from "@/components/niko-table/grid/components/grid-row-reorder"
import { DataGridShortcutsButton } from "@/components/niko-table/grid/components/grid-shortcuts-dialog"
import { DataGridStatusBar } from "@/components/niko-table/grid/components/grid-status-bar"
import {
  DataGridAddRows,
  DataGridClearAll,
  DataGridPasteHint,
  DataGridRedo,
  DataGridToolbar,
  DataGridUndo,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridColumns } from "@/components/niko-table/grid/core/data-grid-columns-context"
import {
  DataGridCell,
  useDataGridContext,
} from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import {
  useGridColumns,
  type GridColumnSpec,
} from "@/components/niko-table/grid/hooks/use-grid-columns"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import {
  FILTER_VARIANTS,
  SYSTEM_COLUMN_IDS,
} from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { cn } from "@/lib/utils"
import { ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react"
import * as React from "react"

function formatPos(
  pos: { rowId: string; columnId: string } | null | undefined,
): string {
  if (!pos) return "None"
  return `${pos.rowId} / ${pos.columnId}`
}

function formatSearch(globalFilter: unknown): string {
  if (typeof globalFilter === "string") return globalFilter || "None"
  if (
    typeof globalFilter === "object" &&
    globalFilter &&
    "filters" in globalFilter
  ) {
    const filterObj = globalFilter as {
      filters: unknown[]
      joinOperator: string
    }
    return `OR Filter (${filterObj.filters?.length || 0} conditions)`
  }
  return "None"
}

// ---------------------------------------------------------------------------
// Deterministic sample data (no Math.random → no hydration mismatch).
// ---------------------------------------------------------------------------
const FIRST = ["Bailey", "Olivia", "Noah", "Mia", "Liam", "Emma", "Ava", "Kai"]
const LAST = ["Kohler", "Hansen", "Reilly", "Nolan", "Abbott", "Lynch"]
const TEAMS = ["Falcons", "Titans", "Rovers", "Wolves", "Hawks", "Comets"]
const VENUES = ["Central Arena", "Riverside Hall", "North Gym", "Summit Center"]
const STATUSES = ["Draft", "Ready", "Needs review", "Conflict"]

const TEAM_OPTIONS = TEAMS.map(t => ({ label: t, value: t }))
const STATUS_OPTIONS = STATUSES.map(s => ({ label: s, value: s }))

const pad = (n: number, w = 2) => String(n).padStart(w, "0")
const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length]!

interface Column {
  id: string
  header: string
  width: number
  gen: (i: number) => string
  type?: "text" | "select" | "number" | "date" | "checkbox"
  options?: readonly string[]
}

const COLUMNS: Column[] = [
  {
    id: "firstName",
    header: "First Name",
    width: 140,
    gen: i => pick(FIRST, i),
  },
  { id: "lastName", header: "Last Name", width: 140, gen: i => pick(LAST, i) },
  {
    id: "email",
    header: "Email",
    width: 240,
    gen: i =>
      `${pick(FIRST, i).toLowerCase()}.${pick(LAST, i).toLowerCase()}${i}@example.com`,
  },
  { id: "homeTeam", header: "Home Team", width: 140, gen: i => pick(TEAMS, i) },
  {
    id: "awayTeam",
    header: "Away Team",
    width: 140,
    gen: i => pick(TEAMS, i + 3),
  },
  { id: "venue", header: "Venue", width: 160, gen: i => pick(VENUES, i) },
  {
    id: "date",
    header: "Date",
    width: 150,
    type: "date",
    gen: i => `2026-${pad(1 + (i % 12))}-${pad(1 + (i % 28))}`,
  },
  {
    id: "fee",
    header: "Fee",
    width: 110,
    type: "number",
    gen: i => String(25 + (i % 40)),
  },
  {
    id: "confirmed",
    header: "Confirmed",
    width: 120,
    type: "checkbox",
    gen: i => (i % 3 === 0 ? "true" : "false"),
  },
  {
    id: "status",
    header: "Status",
    width: 160,
    type: "select",
    options: STATUSES,
    gen: i => pick(STATUSES, i),
  },
]

const INITIAL_COLUMN_SPECS: GridColumnSpec[] = COLUMNS.map(c => ({
  id: c.id,
  label: c.header,
  type: c.type ?? "text",
  width: c.width,
  ...(c.options ? { options: c.options } : {}),
}))

const DEFAULT_ROW_COUNT = 500
const MAX_ROWS = 500_000
const ROW_COUNT_OPTIONS = [500, 10_000, 100_000, 500_000] as const
const ROW_HEIGHT = 37

/**
 * Tight cell matrix. Skip `border-r` on the pinned select gutter — the pin
 * separator already draws the edge; a second rule misaligns vs the header.
 */
const gridCellClassName = (_row: GridRow, columnId: string) =>
  cn(
    "p-0 align-middle",
    columnId !== SYSTEM_COLUMN_IDS.SELECT &&
      "border-border border-r last:border-r-0",
  )

/** Gutter width — grip (14) + checkbox (16) + padding (8) + breathing room. */
const GUTTER_SIZE = 52

/**
 * Exact same chrome for header + body: fill the sticky cell (ignores TableHead
 * `px-2`), reserved grip column, then a fixed-size checkbox slot so select-all
 * and per-row checkboxes share one x-coordinate. Pin separator alone draws the
 * right edge (no `border-r` on this column).
 */
function GutterFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center gap-0.5 px-1">
      {children}
    </div>
  )
}

const TRUTHY = ["true", "1", "yes"]

/** Resolve a raw string into a CellState against a column's type. */
function resolveCellFor(
  col: { type?: string; options?: readonly string[] } | undefined,
  raw: string,
): CellState<string> {
  const trimmed = raw.trim()
  switch (col?.type) {
    case "select": {
      const match = col.options?.includes(raw) ?? false
      return {
        raw,
        value: match ? raw : null,
        status: raw === "" ? "empty" : match ? "valid" : "invalid",
      }
    }
    case "number": {
      if (trimmed === "") return { raw, value: null, status: "empty" }
      const ok = Number.isFinite(Number(trimmed))
      return {
        raw,
        value: ok ? trimmed : null,
        status: ok ? "valid" : "invalid",
      }
    }
    case "date": {
      if (trimmed === "") return { raw, value: null, status: "empty" }
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      return {
        raw,
        value: ok ? trimmed : null,
        status: ok ? "valid" : "invalid",
      }
    }
    case "checkbox": {
      const isTrue = TRUTHY.includes(trimmed.toLowerCase())
      return { raw: String(isTrue), value: String(isTrue), status: "valid" }
    }
    default:
      return { raw, value: raw || null, status: raw === "" ? "empty" : "valid" }
  }
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})
const COLUMN_FORMATTERS: Record<string, (raw: string) => string> = {
  fee: raw => {
    const n = Number(raw)
    return Number.isFinite(n) ? usd.format(n) : raw
  },
}

// New/empty rows carry no cell keys — a missing value renders empty.
const createEmptyRow = (id: string): GridRow => ({ id })

function makeRows(count: number): GridRow[] {
  return Array.from({ length: count }, (_, i) => {
    const row: GridRow = { id: `row-${i}` }
    for (const col of COLUMNS) row[col.id] = resolveCellFor(col, col.gen(i))
    return row
  })
}

const INITIAL_ROWS = makeRows(DEFAULT_ROW_COUNT)

/** Gutter cell: click row number to select; hover shows checkbox; grip for reorder. */
function GutterCell({
  rowId,
  isSelected,
}: {
  rowId: string
  isSelected: boolean
}) {
  const { selectRow, displayIndexOf } = useDataGridContext<GridRow>()
  const { toggleRowSelection } = useDataTable<GridRow>()
  const rowReorder = useDataGridRowReorder()
  const shiftRef = React.useRef(false)
  const isDragging = rowReorder?.draggingRowId === rowId
  // Display order (post sort/filter) — never TanStack source `row.index`.
  const displayIndex = displayIndexOf(rowId) ?? 0
  return (
    <div
      onClick={() => selectRow(rowId)}
      onKeyDown={e => {
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          selectRow(rowId)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select row ${displayIndex + 1}`}
      // No positioned wrapper — GutterFrame anchors to the sticky td padding
      // box so header + body share the same 52px coordinate space.
      className={cn(
        "block h-9 w-full cursor-pointer group-data-[active-row=true]:bg-primary/15",
        isDragging && "opacity-50",
      )}
    >
      <GutterFrame>
        <div className="flex size-3.5 shrink-0 items-center justify-center">
          {rowReorder ? (
            <button
              type="button"
              title="Drag to reorder"
              aria-label={`Drag to reorder row ${displayIndex + 1}`}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => rowReorder.onRowReorderMouseDown(e, rowId)}
              className="flex size-3.5 cursor-grab items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 active:cursor-grabbing"
            >
              <GripVertical className="size-3.5" />
            </button>
          ) : null}
        </div>
        {/* Fixed w-4 — same slot as header select-all checkbox. */}
        <div className="relative flex size-4 shrink-0 items-center justify-center">
          <span className="text-xs text-muted-foreground tabular-nums group-hover:invisible group-data-[active-row=true]:font-semibold group-data-[active-row=true]:text-foreground group-data-[state=selected]:invisible">
            {displayIndex + 1}
          </span>
          <span
            onPointerDown={e => {
              shiftRef.current = e.shiftKey
            }}
            onClick={e => e.stopPropagation()}
            className="absolute inset-0 hidden items-center justify-center group-hover:flex group-data-[state=selected]:flex"
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() =>
                toggleRowSelection(rowId, shiftRef.current)
              }
              aria-label={`Toggle row ${displayIndex + 1}`}
            />
          </span>
        </div>
      </GutterFrame>
    </div>
  )
}

/** Search + faceted + advanced filters — same pattern as the homepage live demo. */
function FilterToolbar() {
  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2 px-0">
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="Search rows..." />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="flex-wrap px-0">
        <DataTableFacetedFilter
          accessorKey="homeTeam"
          title="Home Team"
          options={TEAM_OPTIONS}
          multiple
        />
        <DataTableFacetedFilter
          accessorKey="status"
          title="Status"
          options={STATUS_OPTIONS}
          multiple
        />
        <DataTableSortMenu />
        <DataTableFilterMenu />
        <DataTableClearFilter />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

/** Row-selection bar: appears when checkboxes are ticked. */
function RowSelectionBar() {
  const { table } = useDataTable<GridRow>()
  const { grid } = useDataGridContext<GridRow>()
  const selected = table.getSelectedRowModel().rows
  return (
    <DataTableSelectionBar
      selectedCount={selected.length}
      onClear={() => table.resetRowSelection()}
    >
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          grid.removeRows(selected.map(r => r.id))
          table.resetRowSelection()
        }}
      >
        <Trash2 className="size-4" />
        Delete rows
      </Button>
    </DataTableSelectionBar>
  )
}

/** Header title that selects the whole column on click (sort stays in the ⋯ menu). */
function SelectableColumnTitle() {
  const { column } = useColumnHeaderContext(true)
  const { selectColumn } = useDataGridContext<GridRow>()
  return (
    <button
      type="button"
      onClick={() => selectColumn(column.id)}
      title="Select column"
      className="-mx-1 cursor-pointer rounded px-1 text-left transition-colors hover:bg-muted"
    >
      <DataTableColumnTitle />
    </button>
  )
}

/** Cell dispatcher: picks the editor by the column's type. The grid stays
 *  type-agnostic — this palette is consumer-owned. */
function GridCellByType({
  col,
  resolveCell,
  ...p
}: CellEditorProps & {
  col: GridColumnSpec
  resolveCell: (columnId: string, raw: string) => CellState<string>
}) {
  switch (col.type) {
    case "select":
      return (
        <GridSelectCell
          {...p}
          options={(col.options ?? []).map(o => ({ label: o, value: o }))}
          placeholder="Select…"
          displayLabel={p.cell.value ?? undefined}
        />
      )
    case "number":
      return (
        <GridNumberCell
          {...p}
          resolve={raw => resolveCell(col.id, raw)}
          placeholder={col.label}
          format={COLUMN_FORMATTERS[col.id]}
        />
      )
    case "date":
      return <GridDateCell {...p} placeholder={col.label} />
    case "checkbox":
      return <GridCheckboxCell {...p} aria-label={col.label} />
    default:
      return (
        <GridTextCell
          {...p}
          resolve={raw => resolveCell(col.id, raw)}
          placeholder={col.label}
        />
      )
  }
}

export function GridAllFeatures() {
  const [resetKey, setResetKey] = React.useState(0)
  return (
    <GridAllFeaturesInner
      key={resetKey}
      onReset={() => setResetKey(k => k + 1)}
    />
  )
}

/** Live state card — table chrome + grid engine. Must render inside DataTableRoot. */
function CurrentTableStatePanel({
  grid,
  columnCount,
  onReset,
}: {
  grid: ReturnType<typeof useDataGrid<GridRow>>
  columnCount: number
  onReset: () => void
}) {
  const { table } = useDataTable<GridRow>()
  const state = table.getState()
  const sorting = state.sorting
  const columnFilters = state.columnFilters
  const columnVisibility = state.columnVisibility
  const columnPinning = state.columnPinning
  const rowSelection = state.rowSelection
  const globalFilter = state.globalFilter
  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const hiddenCount = Object.values(columnVisibility).filter(
    v => v === false,
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Table State</CardTitle>
        <CardDescription>
          Live view of table + grid state for demonstration
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset All State
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium">Search Query:</span>
            <span className="text-foreground">
              {formatSearch(globalFilter)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total Rows:</span>
            <span className="text-foreground">{grid.rows.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Selected Rows:</span>
            <span className="text-foreground">{selectedCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Active Filters:</span>
            <span className="text-foreground">{columnFilters.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Sorting:</span>
            <span className="text-foreground">
              {sorting.length > 0
                ? sorting
                    .map(s => `${s.id} ${s.desc ? "desc" : "asc"}`)
                    .join(", ")
                : "None"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Hidden Columns:</span>
            <span className="text-foreground">{hiddenCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Pinned Columns:</span>
            <span className="text-foreground">
              {columnPinning.left?.length || 0} Left,{" "}
              {columnPinning.right?.length || 0} Right
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Dynamic Columns:</span>
            <span className="text-foreground">{columnCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Focused Cell:</span>
            <span className="text-foreground">
              {formatPos(grid.focusedCell)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Editing Cell:</span>
            <span className="text-foreground">
              {formatPos(grid.editingCell)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Selection Anchor:</span>
            <span className="text-foreground">
              {formatPos(grid.selectionAnchor)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Can Undo / Redo:</span>
            <span className="text-foreground">
              {grid.canUndo ? "Yes" : "No"} / {grid.canRedo ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Last Commit:</span>
            <span className="text-foreground">
              {grid.lastCommit
                ? `${grid.lastCommit.kind} (seq ${grid.lastCommit.seq})`
                : "None"}
            </span>
          </div>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-90">
            <ChevronRight className="size-3.5 transition-transform" />
            View Full State Object
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[10px] leading-relaxed">
              {JSON.stringify(
                {
                  focusedCell: grid.focusedCell,
                  editingCell: grid.editingCell,
                  selectionAnchor: grid.selectionAnchor,
                  canUndo: grid.canUndo,
                  canRedo: grid.canRedo,
                  lastCommit: grid.lastCommit,
                  rowCount: grid.rows.length,
                  columnCount,
                  globalFilter,
                  sorting,
                  columnFilters,
                  columnVisibility,
                  columnPinning,
                  rowSelection,
                },
                null,
                2,
              )}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function GridAllFeaturesInner({ onReset }: { onReset: () => void }) {
  const cols = useGridColumns({ initialColumns: INITIAL_COLUMN_SPECS })
  const columnById = React.useMemo(
    () => Object.fromEntries(cols.columns.map(c => [c.id, c])),
    [cols.columns],
  )
  const resolveCell = React.useCallback(
    (columnId: string, raw: string) =>
      resolveCellFor(columnById[columnId], raw),
    [columnById],
  )

  const grid = useDataGrid<GridRow>({
    columnIds: cols.columnIds,
    createEmptyRow,
    maxRows: MAX_ROWS,
    initialRows: INITIAL_ROWS,
  })
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)

  // Stress test — regenerate the whole dataset to feel the grid at scale.
  const [genMs, setGenMs] = React.useState<number | null>(null)
  const rowCount = grid.rows.length
  const regenerate = React.useCallback(
    (count: number) => {
      const t0 = performance.now()
      const rows = makeRows(count)
      setGenMs(Math.round(performance.now() - t0))
      grid.updateRows(() => rows)
      if (rows[0]) {
        grid.selectCell({ rowId: rows[0].id, columnId: cols.columnIds[0]! })
      }
    },
    [grid, cols.columnIds],
  )

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(() => {
    // Leading gutter — uses the system SELECT id so it auto-enables row
    // selection AND pins left (stays put on horizontal scroll).
    const gutter: DataTableColumnDef<GridRow> = {
      id: SYSTEM_COLUMN_IDS.SELECT,
      size: GUTTER_SIZE,
      minSize: GUTTER_SIZE,
      maxSize: GUTTER_SIZE,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      header: ({ table }) => (
        // Direct child of sticky th — `absolute inset-0` fills the padding box
        // (full column width), not the inner content box after TableHead `pl-2`.
        <GutterFrame>
          <div className="size-3.5 shrink-0" aria-hidden />
          <div className="flex size-4 shrink-0 items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllRowsSelected()
                  ? true
                  : table.getIsSomeRowsSelected()
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={v => table.toggleAllRowsSelected(!!v)}
              aria-label="Select all rows"
            />
          </div>
        </GutterFrame>
      ),
      cell: ctx => (
        <GutterCell rowId={ctx.row.id} isSelected={ctx.row.getIsSelected()} />
      ),
    }

    const dataColumns = cols.columns.map(
      (col): DataTableColumnDef<GridRow> => ({
        id: col.id,
        accessorFn: (row: GridRow) => {
          const v = row[col.id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: () => (
          <DataTableColumnHeader
            onContextMenu={e => {
              // Right-click the header → open the same ⋯ column menu.
              e.preventDefault()
              e.currentTarget
                .closest('[data-slot="table-head"]')
                ?.querySelector<HTMLElement>(
                  '[data-slot="dropdown-menu-trigger"]',
                )
                ?.click()
            }}
          >
            <SelectableColumnTitle />
            <DataTableColumnActions>
              <DataTableColumnSortOptions />
              <DataTableColumnPinOptions />
              <DataTableColumnHideOptions />
              <GridColumnMenuOptions />
            </DataTableColumnActions>
          </DataTableColumnHeader>
        ),
        size: col.width,
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          variant:
            col.id === "homeTeam" || col.id === "status"
              ? FILTER_VARIANTS.MULTI_SELECT
              : col.type === "select"
                ? FILTER_VARIANTS.SELECT
                : col.type === "number"
                  ? FILTER_VARIANTS.NUMBER
                  : col.type === "date"
                    ? FILTER_VARIANTS.DATE
                    : col.type === "checkbox"
                      ? FILTER_VARIANTS.BOOLEAN
                      : FILTER_VARIANTS.TEXT,
          label: col.label,
          ...(col.id === "homeTeam"
            ? { options: TEAM_OPTIONS }
            : col.id === "status"
              ? { options: STATUS_OPTIONS }
              : col.options
                ? {
                    options: col.options.map(o => ({ label: o, value: o })),
                  }
                : {}),
        },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={col.id}>
            {(p: CellEditorProps) => (
              <GridCellByType col={col} resolveCell={resolveCell} {...p} />
            )}
          </DataGridCell>
        ),
      }),
    )

    return [gutter, ...dataColumns]
  }, [cols.columns, resolveCell])

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Stress test:</span>
        {ROW_COUNT_OPTIONS.map(count => (
          <button
            key={count}
            type="button"
            onClick={() => regenerate(count)}
            className={cn(
              "rounded-md border border-border px-3 py-1.5 text-sm tabular-nums transition-colors",
              count === rowCount
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted",
            )}
          >
            {count.toLocaleString()} rows
          </button>
        ))}
        {genMs != null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            built {rowCount.toLocaleString()} rows in {genMs}ms
          </span>
        )}
      </div>
      <DataTableRoot
        data={grid.rows}
        columns={columns}
        getRowId={r => r.id}
        initialState={{ columnPinning: { left: [SYSTEM_COLUMN_IDS.SELECT] } }}
      >
        <DataGrid grid={grid} onRequestShortcuts={() => setShortcutsOpen(true)}>
          {/* Opt-in features — mix and match. */}
          <DataGridClipboard resolveCell={resolveCell} />
          <DataGridFillHandle />
          <DataGridMove />
          <DataGridCrossHighlight />
          <DataGridRowReorder />
          <DataTableColumnResize />
          <DataGridColumns value={cols}>
            <div className="space-y-3">
              <FilterToolbar />
              <DataGridToolbar className="justify-between gap-x-2 gap-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DataGridUndo />
                  <DataGridRedo />
                  <DataGridAddRows count={5} />
                  <DataGridAddColumnButton />
                  <DataTableViewDndMenu
                    columnOrder={cols.columnIds}
                    onColumnOrderChange={cols.reorderColumns}
                  />
                  <DataGridClearAll />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DataTableExportButton
                    filename="grid-export"
                    useHeaderLabels
                    excludeColumns={[SYSTEM_COLUMN_IDS.SELECT]}
                  />
                  <DataGridShortcutsButton
                    open={shortcutsOpen}
                    onOpenChange={setShortcutsOpen}
                  />
                  <DataGridPasteHint />
                </div>
              </DataGridToolbar>
              <div>
                <DataTable maxHeight={520}>
                  <DataTableVirtualizedHeader />
                  <DataTableVirtualizedBody<GridRow>
                    estimateSize={ROW_HEIGHT}
                    fixedRowHeight
                    getCellClassName={gridCellClassName}
                  >
                    <DataTableRowContextMenuSlot>
                      <GridRowMenu />
                    </DataTableRowContextMenuSlot>
                  </DataTableVirtualizedBody>
                </DataTable>
                <button
                  type="button"
                  onClick={() => {
                    const created = grid.addRows(1)
                    // Focus the new row so the grid scrolls to it (scroll follows
                    // focus) and it's ready for typing.
                    const first = created[0]
                    if (first && cols.columnIds[0]) {
                      grid.selectCell({
                        rowId: first.id,
                        columnId: cols.columnIds[0],
                      })
                    }
                  }}
                  disabled={grid.rows.length >= grid.maxRows}
                  className="flex w-full items-center gap-1.5 border border-t-0 border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  Add row
                </button>
              </div>
              <RowSelectionBar />
              <DataGridStatusBar />
            </div>
          </DataGridColumns>
        </DataGrid>
        <CurrentTableStatePanel
          grid={grid}
          columnCount={cols.columns.length}
          onReset={onReset}
        />
      </DataTableRoot>
    </div>
  )
}
