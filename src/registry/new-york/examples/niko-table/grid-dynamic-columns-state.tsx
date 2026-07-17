"use client"

/**
 * niko-table/grid — dynamic columns with a live state panel for docs.
 */
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnHideOptions } from "@/components/niko-table/components/data-table-column-hide"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTableViewDndMenu } from "@/components/niko-table/components/data-table-view-dnd-menu"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridAddColumnButton } from "@/components/niko-table/grid/components/grid-add-column"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { GridColumnMenuOptions } from "@/components/niko-table/grid/components/grid-column-menu"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridAddRows,
  DataGridToolbar,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridColumns } from "@/components/niko-table/grid/core/data-grid-columns-context"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import {
  useGridColumns,
  type GridColumnSpec,
} from "@/components/niko-table/grid/hooks/use-grid-columns"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
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
import { ChevronRight } from "lucide-react"
import * as React from "react"

const INITIAL_COLUMNS: GridColumnSpec[] = [
  { id: "feature", label: "Feature", type: "text", width: 200 },
  { id: "owner", label: "Owner", type: "text", width: 160 },
  { id: "status", label: "Status", type: "text", width: 160 },
]

const resolveCell = (_columnId: string, raw: string): CellState<string> => ({
  raw,
  value: raw || null,
  status: raw === "" ? "empty" : "valid",
})

const c = (raw: string) => resolveCell("", raw)
const INITIAL_ROWS: GridRow[] = [
  { id: "r1", feature: c("Clipboard"), owner: c("Bailey"), status: c("Done") },
  {
    id: "r2",
    feature: c("Fill handle"),
    owner: c("Noah"),
    status: c("In review"),
  },
  {
    id: "r3",
    feature: c("Dynamic columns"),
    owner: c("Mia"),
    status: c("Building"),
  },
]

const createEmptyRow = (id: string): GridRow => ({ id })
const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

function formatPos(
  pos: { rowId: string; columnId: string } | null | undefined,
): string {
  if (!pos) return "None"
  return `${pos.rowId} / ${pos.columnId}`
}

export function GridDynamicColumnsState() {
  const [resetKey, setResetKey] = React.useState(0)
  return (
    <GridDynamicColumnsStateInner
      key={resetKey}
      onReset={() => setResetKey(k => k + 1)}
    />
  )
}

function GridDynamicColumnsStateInner({ onReset }: { onReset: () => void }) {
  const cols = useGridColumns({ initialColumns: INITIAL_COLUMNS })
  const grid = useDataGrid<GridRow>({
    columnIds: cols.columnIds,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      cols.columns.map(col => ({
        id: col.id,
        accessorFn: (row: GridRow) => {
          const v = row[col.id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle />
            <DataTableColumnActions>
              <DataTableColumnHideOptions />
              <GridColumnMenuOptions />
            </DataTableColumnActions>
          </DataTableColumnHeader>
        ),
        size: col.width,
        meta: { label: col.label },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={col.id}>
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={raw => resolveCell(col.id, raw)}
                placeholder={col.label}
              />
            )}
          </DataGridCell>
        ),
      })),
    [cols.columns],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
        <DataGrid grid={grid} className="space-y-2 outline-none">
          {/* Flex-fill + drag-resizable columns */}
          <DataTableColumnResize />
          <DataGridClipboard resolveCell={resolveCell} />
          <DataGridColumns value={cols}>
            <DataGridToolbar>
              <DataGridAddRows count={3} />
              <DataGridAddColumnButton />
              <DataTableViewDndMenu
                columnOrder={cols.columnIds}
                onColumnOrderChange={cols.reorderColumns}
              />
            </DataGridToolbar>
            <DataTable maxHeight={360}>
              <DataTableVirtualizedHeader />
              <DataTableVirtualizedBody<GridRow>
                estimateSize={37}
                fixedRowHeight
                getCellClassName={gridCellClassName}
              >
                <DataTableRowContextMenuSlot>
                  <GridRowMenu />
                </DataTableRowContextMenuSlot>
              </DataTableVirtualizedBody>
            </DataTable>
          </DataGridColumns>
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
              <span className="font-medium">Column Count:</span>
              <span className="text-foreground">{cols.columnIds.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-medium">Column Ids:</span>
              <span className="truncate text-end text-foreground">
                {cols.columnIds.join(", ")}
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
                    columnCount: cols.columnIds.length,
                    columnIds: cols.columnIds,
                    columns: cols.columns,
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
