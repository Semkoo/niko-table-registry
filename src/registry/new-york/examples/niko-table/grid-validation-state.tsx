"use client"

/**
 * niko-table/grid — Zod validation with a live state panel for docs.
 */
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import {
  DataGridAddRows,
  DataGridPasteHint,
  DataGridToolbar,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { ChevronRight } from "lucide-react"
import * as React from "react"
import { z } from "zod"

const COLUMN_IDS = ["date", "start", "end", "venue"] as const
type ColumnId = (typeof COLUMN_IDS)[number]

const COLUMNS: {
  id: ColumnId
  label: string
  placeholder: string
  required: boolean
}[] = [
  { id: "date", label: "Date", placeholder: "YYYY-MM-DD", required: true },
  { id: "start", label: "Start Time", placeholder: "HH:MM", required: true },
  { id: "end", label: "End Time", placeholder: "HH:MM", required: true },
  { id: "venue", label: "Venue", placeholder: "Optional", required: false },
]
const COLUMN_BY_ID = Object.fromEntries(COLUMNS.map(c => [c.id, c])) as Record<
  ColumnId,
  (typeof COLUMNS)[number]
>

const isRealDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m! - 1 &&
    dt.getUTCDate() === d
  )
}
const FIELD_SCHEMAS: Record<ColumnId, z.ZodType<string>> = {
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .refine(isRealDate, "That date doesn't exist on the calendar"),
  start: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 09:30"),
  end: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 17:00"),
  venue: z.string(),
}

function resolveCell(columnId: string, raw: string): CellState<string> {
  const trimmed = raw.trim()
  const col = COLUMN_BY_ID[columnId as ColumnId]
  if (trimmed === "") {
    return { raw, value: null, status: col?.required ? "empty" : "valid" }
  }
  const result = FIELD_SCHEMAS[columnId as ColumnId].safeParse(trimmed)
  return result.success
    ? { raw, value: result.data, status: "valid" }
    : {
        raw,
        value: null,
        status: "invalid",
        error: result.error.issues[0]!.message,
      }
}

function crossFieldEndError(row: GridRow): string | null {
  const start = row.start
  const end = row.end
  if (typeof start !== "object" || typeof end !== "object") return null
  if (start?.status !== "valid" || end?.status !== "valid") return null
  return (end.value ?? "") > (start.value ?? "")
    ? null
    : "End time must be after the start time"
}

const cell = (columnId: ColumnId, raw: string) => resolveCell(columnId, raw)
const INITIAL_ROWS: GridRow[] = [
  {
    id: "r1",
    date: cell("date", "2026-07-20"),
    start: cell("start", "09:00"),
    end: cell("end", "10:30"),
    venue: cell("venue", "Rink A"),
  },
  {
    id: "r2",
    date: cell("date", "2026-13-02"),
    start: cell("start", "18:00"),
    end: cell("end", "19:00"),
    venue: cell("venue", ""),
  },
  {
    id: "r3",
    date: cell("date", "2026-07-21"),
    start: cell("start", "20:00"),
    end: cell("end", "19:15"),
    venue: cell("venue", "Rink B"),
  },
]

const createEmptyRow = (id: string): GridRow => ({ id })
const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

const rawOf = (row: GridRow, id: ColumnId) => {
  const v = row[id]
  return typeof v === "object" && v != null ? v.raw : ""
}

function formatPos(
  pos: { rowId: string; columnId: string } | null | undefined,
): string {
  if (!pos) return "None"
  return `${pos.rowId} / ${pos.columnId}`
}

export function GridValidationState() {
  const [resetKey, setResetKey] = React.useState(0)
  return (
    <GridValidationStateInner
      key={resetKey}
      onReset={() => setResetKey(k => k + 1)}
    />
  )
}

function GridValidationStateInner({ onReset }: { onReset: () => void }) {
  const grid = useDataGrid<GridRow>({
    columnIds: COLUMN_IDS,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  React.useEffect(() => {
    if (!grid.lastCommit) return
    grid.updateRows(
      rows =>
        rows.map(row => {
          const end = row.end
          if (typeof end !== "object" || end == null) return row
          const base = resolveCell("end", end.raw)
          const crossErr = crossFieldEndError(row)
          const next =
            crossErr && base.status !== "invalid"
              ? { ...base, status: "invalid" as const, error: crossErr }
              : base
          if (next.status === end.status && next.error === end.error) return row
          return { ...row, end: next }
        }),
      { history: false },
    )
  }, [grid.lastCommit, grid])

  const invalidCount = React.useMemo(
    () =>
      grid.rows.filter(row =>
        COLUMN_IDS.some(id => {
          const c = row[id]
          return typeof c === "object" && c?.status === "invalid"
        }),
      ).length,
    [grid.rows],
  )

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      COLUMNS.map(col => ({
        id: col.id,
        accessorFn: (row: GridRow) => rawOf(row, col.id),
        header: () => (
          <span>
            {col.label}
            {col.required && (
              <span aria-hidden className="font-semibold text-destructive">
                {" "}
                *
              </span>
            )}
          </span>
        ),
        size: col.id === "venue" ? 200 : 170,
        meta: { label: col.label, required: col.required },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={col.id}>
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={raw => resolveCell(col.id, raw)}
                placeholder={col.placeholder}
              />
            )}
          </DataGridCell>
        ),
      })),
    [],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
        <DataGrid grid={grid} className="space-y-2 outline-none">
          {/* Flex-fill + drag-resizable columns */}
          <DataTableColumnResize />
          <DataGridClipboard resolveCell={resolveCell} />
          <DataGridFillHandle />
          <DataGridToolbar>
            <DataGridAddRows count={1} />
            <DataGridPasteHint />
            <span className="ms-auto">
              {invalidCount > 0 ? (
                <Badge variant="destructive">
                  {invalidCount} row{invalidCount === 1 ? "" : "s"} need fixing
                </Badge>
              ) : (
                <Badge variant="secondary">All rows valid</Badge>
              )}
            </span>
          </DataGridToolbar>
          <p className="px-1 text-sm text-muted-foreground">
            Hover a red cell for the reason. Try a bad date (2026-13-02), a
            12-hour time, or an end time before the start.
          </p>
          <DataTable maxHeight={320}>
            <DataTableVirtualizedHeader />
            <DataTableVirtualizedBody<GridRow>
              estimateSize={37}
              fixedRowHeight
              getCellClassName={gridCellClassName}
            />
          </DataTable>
        </DataGrid>
      </DataTableRoot>

      <Card>
        <CardHeader>
          <CardTitle>Current Grid State</CardTitle>
          <CardDescription>
            Live view of the grid engine state for demonstration
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
              <span className="font-medium">Total Rows:</span>
              <span className="text-foreground">{grid.rows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Invalid Rows:</span>
              <span className="text-foreground">{invalidCount}</span>
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
                    invalidCount,
                    rows: grid.rows,
                  },
                  null,
                  2,
                )}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  )
}
